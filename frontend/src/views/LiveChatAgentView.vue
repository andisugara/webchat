<template>
  <div class="max-w-7xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-4.5rem)] flex flex-col sm:flex-row gap-4">
    <!-- Left Sidebar: Session Lists -->
    <div class="glass-panel w-full sm:w-80 rounded-2xl p-4 flex flex-col border border-slate-200/90 shadow-sm bg-white/95 overflow-hidden shrink-0">
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
        <div class="flex items-center space-x-2">
          <span class="text-lg">👨‍💼</span>
          <h2 class="font-bold text-slate-900 text-sm">Konsol Petugas</h2>
        </div>
        <button
          @click="fetchSessions"
          class="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition text-xs"
          title="Segarkan Sesi"
        >
          🔄
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 mb-3 text-[11px] font-semibold">
        <button
          @click="filterStatus = 'ALL'"
          class="flex-1 py-1.5 rounded-lg transition"
          :class="filterStatus === 'ALL' ? 'bg-sita-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          Semua ({{ sessions.length }})
        </button>
        <button
          @click="filterStatus = 'ESCALATION_REQUESTED'"
          class="flex-1 py-1.5 rounded-lg transition relative"
          :class="filterStatus === 'ESCALATION_REQUESTED' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          Eskalasi
          <span
            v-if="escalationCount > 0"
            class="inline-block ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-extrabold animate-bounce"
          >
            {{ escalationCount }}
          </span>
        </button>
        <button
          @click="filterStatus = 'AGENT_ACTIVE'"
          class="flex-1 py-1.5 rounded-lg transition"
          :class="filterStatus === 'AGENT_ACTIVE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          Aktif
        </button>
      </div>

      <!-- Sessions List -->
      <div class="flex-1 overflow-y-auto space-y-2 pr-1">
        <div v-if="filteredSessions.length === 0" class="text-center py-10 text-slate-400 text-xs">
          Belum ada sesi di kategori ini.
        </div>

        <div
          v-for="s in filteredSessions"
          :key="s.id"
          @click="selectSession(s)"
          class="p-3 rounded-xl cursor-pointer transition border text-xs relative"
          :class="
            selectedSession?.id === s.id
              ? 'bg-sita-50 border-sita-500 text-slate-900 shadow-sm'
              : s.status === 'ESCALATION_REQUESTED'
              ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/70 text-amber-950 animate-pulse'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
          "
        >
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold truncate max-w-[130px] text-slate-900">{{ s.visitor_name }}</span>
            <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full" :class="getStatusBadge(s.status)">
              {{ formatStatusLabel(s.status) }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 line-clamp-1 mb-1">
            {{ s.last_message || 'Belum ada pesan' }}
          </p>
          <div class="flex items-center justify-between text-[10px] text-slate-400">
            <span>{{ s.message_count }} pesan</span>
            <span>{{ formatTime(s.last_message_at || s.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Pane: Active Chat Room -->
    <div class="glass-panel flex-1 rounded-2xl flex flex-col border border-slate-200/90 shadow-md bg-white/95 overflow-hidden">
      <!-- Chat Header -->
      <div v-if="selectedSession" class="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="font-extrabold text-slate-900 text-base">{{ selectedSession.visitor_name }}</h3>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full" :class="getStatusBadge(selectedSession.status)">
              {{ formatStatusLabel(selectedSession.status) }}
            </span>
          </div>
          <p class="text-xs text-slate-500">
            {{ selectedSession.visitor_email }} • {{ selectedSession.visitor_phone }}
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Takeover / Claim button -->
          <button
            v-if="selectedSession.status === 'ESCALATION_REQUESTED' || selectedSession.status === 'BOT_ACTIVE'"
            @click="handleClaimSession"
            class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center space-x-1"
          >
            <span>🛡️</span>
            <span>Ambil Alih Obrolan</span>
          </button>

          <!-- Close session button -->
          <button
            v-if="selectedSession.status !== 'CLOSED'"
            @click="handleCloseSession"
            class="px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 transition"
          >
            Selesaikan Sesi
          </button>
        </div>
      </div>

      <!-- No Session Selected State -->
      <div v-if="!selectedSession" class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-50/40">
        <span class="text-4xl mb-3">💬</span>
        <h3 class="text-lg font-bold text-slate-800">Pilih Sesi Obrolan</h3>
        <p class="text-xs text-slate-500 max-w-sm mt-1">
          Pilih salah satu percakapan di bilah kiri untuk memantau dialog AI atau memberikan bantuan langsung kepada pengunjung.
        </p>
      </div>

      <!-- Messages Thread -->
      <div v-else ref="agentMessagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
        <div
          v-for="(msg, idx) in sessionMessages"
          :key="msg.id || idx"
          class="flex flex-col"
          :class="msg.sender_type === 'agent' ? 'items-end' : msg.sender_type === 'user' ? 'items-start' : 'items-center'"
        >
          <!-- System message -->
          <div v-if="msg.sender_type === 'system'" class="w-full flex justify-center my-1">
            <div class="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-[11px] text-center border border-amber-200 shadow-2xs">
              ℹ️ {{ msg.content }}
            </div>
          </div>

          <!-- Normal Bubble -->
          <div v-else class="max-w-[80%] space-y-1">
            <div class="flex items-center space-x-2 text-[10px] text-slate-400 px-1" :class="msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'">
              <span class="font-semibold" :class="msg.sender_type === 'agent' ? 'text-emerald-700' : msg.sender_type === 'assistant' ? 'text-sita-700' : 'text-slate-600'">
                {{ msg.sender_name || (msg.sender_type === 'agent' ? 'Petugas' : msg.sender_type === 'assistant' ? 'AI Bot' : 'Pengunjung') }}
              </span>
              <span class="text-[9px] text-slate-400">{{ formatTime(msg.created_at) }}</span>
            </div>

            <div
              class="p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm"
              :class="
                msg.sender_type === 'agent'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : msg.sender_type === 'assistant'
                  ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/90'
              "
            >
              <div class="whitespace-pre-wrap">{{ msg.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Input Box -->
      <div v-if="selectedSession && selectedSession.status !== 'CLOSED'" class="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form @submit.prevent="sendAgentMessage" class="flex items-center space-x-2">
          <input
            v-model="agentInput"
            type="text"
            placeholder="Ketik balasan resmi sebagai Petugas Pelayanan SITA..."
            class="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm transition"
          />
          <button
            type="submit"
            :disabled="!agentInput.trim()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition text-xs sm:text-sm shrink-0 shadow-sm"
          >
            Kirim Balasan
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { SessionAPI, ChatAPI } from '../services/api';
import { getSocket } from '../services/socket';

const sessions = ref<any[]>([]);
const selectedSession = ref<any>(null);
const sessionMessages = ref<any[]>([]);
const filterStatus = ref('ALL');
const agentInput = ref('');
const agentMessagesContainer = ref<HTMLDivElement | null>(null);

const filteredSessions = computed(() => {
  if (filterStatus.value === 'ALL') return sessions.value;
  return sessions.value.filter((s) => s.status === filterStatus.value);
});

const escalationCount = computed(() => {
  return sessions.value.filter((s) => s.status === 'ESCALATION_REQUESTED').length;
});

const fetchSessions = async () => {
  try {
    const res = await SessionAPI.list();
    sessions.value = res.data.sessions || [];
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  }
};

const selectSession = async (session: any) => {
  selectedSession.value = session;
  try {
    const res = await SessionAPI.get(session.id);
    sessionMessages.value = res.data.messages || [];

    const socket = getSocket();
    socket.emit('join_session', session.id);

    await nextTick();
    if (agentMessagesContainer.value) {
      agentMessagesContainer.value.scrollTop = agentMessagesContainer.value.scrollHeight;
    }
  } catch (err) {
    console.error('Failed to load session messages:', err);
  }
};

const handleClaimSession = async () => {
  if (!selectedSession.value) return;
  try {
    await SessionAPI.claim(selectedSession.value.id, 'I Wayan Sastrawan (Petugas)');
    selectedSession.value.status = 'AGENT_ACTIVE';
    await fetchSessions();
    await selectSession(selectedSession.value);
  } catch (err) {
    alert('Gagal mengambil alih sesi.');
  }
};

const handleCloseSession = async () => {
  if (!selectedSession.value) return;
  if (confirm('Selesaikan sesi percakapan ini?')) {
    await SessionAPI.close(selectedSession.value.id, 'Selesai ditangani petugas.');
    selectedSession.value.status = 'CLOSED';
    await fetchSessions();
    await selectSession(selectedSession.value);
  }
};

const sendAgentMessage = async () => {
  if (!selectedSession.value || !agentInput.value.trim()) return;
  const content = agentInput.value.trim();
  agentInput.value = '';

  try {
    const res = await ChatAPI.sendMessage({
      sessionId: selectedSession.value.id,
      senderType: 'agent',
      senderName: 'I Wayan Sastrawan (Petugas Pelayanan)',
      content,
    });

    // Deduplicate in case socket event already pushed it
    if (res.data.userMessage && !sessionMessages.value.some((m) => m.id === res.data.userMessage.id)) {
      sessionMessages.value.push(res.data.userMessage);
    }

    await nextTick();
    if (agentMessagesContainer.value) {
      agentMessagesContainer.value.scrollTop = agentMessagesContainer.value.scrollHeight;
    }
    await fetchSessions();
  } catch (err) {
    alert('Gagal mengirim pesan petugas.');
  }
};

onMounted(async () => {
  await fetchSessions();
  const socket = getSocket();
  socket.emit('join_agent_room');

  socket.off('new_escalation_alert');
  socket.on('new_escalation_alert', () => {
    fetchSessions();
  });

  socket.off('new_message');
  socket.on('new_message', (msg) => {
    if (selectedSession.value && msg.session_id === selectedSession.value.id) {
      if (!sessionMessages.value.some((m) => m.id === msg.id)) {
        sessionMessages.value.push(msg);
        nextTick(() => {
          if (agentMessagesContainer.value) {
            agentMessagesContainer.value.scrollTop = agentMessagesContainer.value.scrollHeight;
          }
        });
      }
    }
  });
});

onUnmounted(() => {
  const socket = getSocket();
  socket.off('new_escalation_alert');
  socket.off('new_message');
});

const formatStatusLabel = (st: string) => {
  switch (st) {
    case 'ESCALATION_REQUESTED':
      return 'Eskalasi';
    case 'AGENT_ACTIVE':
      return 'Live Agent';
    case 'BOT_ACTIVE':
      return 'AI Bot';
    case 'CLOSED':
      return 'Selesai';
    default:
      return st;
  }
};

const getStatusBadge = (st: string) => {
  switch (st) {
    case 'ESCALATION_REQUESTED':
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'AGENT_ACTIVE':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'BOT_ACTIVE':
      return 'bg-sita-100 text-sita-800 border border-sita-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const formatTime = (dt?: string) => {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};
</script>
