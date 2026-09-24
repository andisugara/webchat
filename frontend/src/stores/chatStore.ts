import { defineStore } from 'pinia';
import { SessionAPI, ChatAPI } from '../services/api';
import { getSocket } from '../services/socket';

export interface ChatMessage {
  id?: string;
  session_id?: string;
  sender_type: 'user' | 'assistant' | 'agent' | 'system';
  sender_name?: string;
  content: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  latency_ms?: number;
  model_name?: string;
  retrieved_sources?: Array<{ title: string; category: string; sourceUrl: string | null; score: number }>;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  status: 'BOT_ACTIVE' | 'ESCALATION_REQUESTED' | 'AGENT_ACTIVE' | 'CLOSED';
  assigned_agent_id?: string;
  created_at?: string;
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    session: null as ChatSession | null,
    messages: [] as ChatMessage[],
    isLoading: false,
    isEscalating: false,
    lastDebug: null as any,
    isAgentTyping: false,
  }),

  getters: {
    hasSession: (state) => !!state.session?.id,
    isAgentMode: (state) => state.session?.status === 'AGENT_ACTIVE',
    isEscalationRequested: (state) => state.session?.status === 'ESCALATION_REQUESTED',
  },

  actions: {
    async initSession(visitor: { visitorName: string; visitorEmail: string; visitorPhone: string }) {
      this.isLoading = true;
      try {
        const savedSessionId = localStorage.getItem('sita_session_id');
        const res = await SessionAPI.createOrGet({
          ...visitor,
          sessionId: savedSessionId || undefined,
        });

        this.session = res.data.session;
        localStorage.setItem('sita_session_id', this.session!.id);

        // Fetch full message history
        const sessionDetail = await SessionAPI.get(this.session!.id);
        this.messages = sessionDetail.data.messages || [];

        this.setupSocket();
      } catch (err) {
        console.error('Failed to init session:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async resumeSavedSession() {
      const savedSessionId = localStorage.getItem('sita_session_id');
      if (!savedSessionId) return false;

      try {
        const sessionDetail = await SessionAPI.get(savedSessionId);
        if (sessionDetail.data?.session) {
          this.session = sessionDetail.data.session;
          this.messages = sessionDetail.data.messages || [];
          this.setupSocket();
          return true;
        }
      } catch (err) {
        console.warn('Session expired or invalid, clearing local storage.');
        localStorage.removeItem('sita_session_id');
      }
      return false;
    },

    setupSocket() {
      if (!this.session?.id) return;
      const socket = getSocket();

      socket.emit('join_session', this.session.id);

      socket.off('new_message');
      socket.on('new_message', (msg: ChatMessage) => {
        const exists = this.messages.some((m) => m.id === msg.id);
        if (!exists) {
          this.messages.push(msg);
        }
      });

      socket.off('session_status_changed');
      socket.on('session_status_changed', (data: { sessionId: string; status: any }) => {
        if (this.session && this.session.id === data.sessionId) {
          this.session.status = data.status;
        }
      });

      socket.off('user_typing');
      socket.on('user_typing', () => {
        this.isAgentTyping = true;
      });

      socket.off('user_stop_typing');
      socket.on('user_stop_typing', () => {
        this.isAgentTyping = false;
      });
    },

    async sendMessage(content: string) {
      if (!this.session?.id || !content.trim()) return;

      const userText = content.trim();
      this.isLoading = true;

      try {
        const res = await ChatAPI.sendMessage({
          sessionId: this.session.id,
          senderType: 'user',
          senderName: this.session.visitor_name,
          content: userText,
        });

        // If not using socket update immediately
        if (res.data.userMessage && !this.messages.some((m) => m.id === res.data.userMessage.id)) {
          this.messages.push(res.data.userMessage);
        }
        if (res.data.assistantMessage && !this.messages.some((m) => m.id === res.data.assistantMessage.id)) {
          this.messages.push(res.data.assistantMessage);
        }

        if (res.data.debug) {
          this.lastDebug = res.data.debug;
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async requestEscalation(reason?: string) {
      if (!this.session?.id) return;
      this.isEscalating = true;
      try {
        const res = await SessionAPI.escalate(this.session.id, reason);
        this.session.status = 'ESCALATION_REQUESTED';
        
        const socket = getSocket();
        socket.emit('request_escalation', {
          sessionId: this.session.id,
          visitorName: this.session.visitor_name,
          reason,
        });

        // Refresh messages
        const sessionDetail = await SessionAPI.get(this.session.id);
        this.messages = sessionDetail.data.messages || [];
      } catch (err) {
        console.error('Escalation failed:', err);
      } finally {
        this.isEscalating = false;
      }
    },

    resetSession() {
      localStorage.removeItem('sita_session_id');
      this.session = null;
      this.messages = [];
      this.lastDebug = null;
    }
  },
});
