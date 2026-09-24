<template>
  <div class="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 h-[calc(100vh-4.5rem)] flex flex-col">
    <!-- Clean Customer Chat Header -->
    <div class="glass-panel rounded-2xl p-3 sm:p-4 mb-3 flex items-center justify-between border border-slate-200/90 shadow-sm bg-white/95">
      <!-- Visitor Profile & Status -->
      <div class="flex items-center space-x-3">
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-sita-600 flex items-center justify-center font-bold text-white shadow-sm">
            {{ chatStore.session ? chatStore.session.visitor_name.charAt(0).toUpperCase() : '?' }}
          </div>
          <span
            class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            :class="chatStore.isAgentMode ? 'bg-emerald-500' : 'bg-sita-500'"
          ></span>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-900 text-sm">
              {{ chatStore.session?.visitor_name || 'Pengunjung' }}
            </span>
            <span
              v-if="chatStore.isAgentMode"
              class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Terhubung dengan Petugas</span>
            </span>
            <span
              v-else-if="chatStore.isEscalationRequested"
              class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
            >
              ⏳ Menghubungkan Petugas...
            </span>
            <span
              v-else
              class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sita-100 text-sita-800 border border-sita-200"
            >
              🤖 Asisten Virtual SITA
            </span>
          </div>
          <span class="text-xs text-slate-500 block truncate max-w-[220px] sm:max-w-none">
            {{ chatStore.session ? `${chatStore.session.visitor_email} • ${chatStore.session.visitor_phone}` : 'Sesi Belum Dimulai' }}
          </span>
        </div>
      </div>

      <!-- Close / End Session Button -->
      <div>
        <button
          @click="handleCloseSession"
          class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold border border-slate-200 hover:border-red-200 transition flex items-center space-x-1.5"
          title="Tutup sesi dan mulai obrolan baru dari awal"
        >
          <span>✕</span>
          <span class="hidden sm:inline">Tutup Sesi</span>
        </button>
      </div>
    </div>

    <!-- Main Chat Window (Pure Room Chat) -->
    <div class="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden border border-slate-200/90 shadow-md bg-white/95 relative">
      <!-- Messages List -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        <!-- Quick Prompts Chips on top of chat -->
        <div v-if="chatStore.messages.length <= 1" class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm mb-2">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">Pilihan Cepat Layanan:</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(prompt, idx) in quickPrompts"
              :key="idx"
              @click="sendQuickPrompt(prompt)"
              class="px-3 py-2 rounded-lg bg-slate-50 hover:bg-sita-50 hover:border-sita-300 text-slate-700 hover:text-sita-900 text-xs font-medium border border-slate-200 transition text-left flex items-center space-x-1.5 shadow-xs"
            >
              <span>{{ prompt.icon }}</span>
              <span>{{ prompt.text }}</span>
            </button>
          </div>
        </div>

        <!-- Chat Bubbles -->
        <div
          v-for="(msg, idx) in chatStore.messages"
          :key="msg.id || idx"
          class="flex flex-col"
          :class="msg.sender_type === 'user' ? 'items-end' : 'items-start'"
        >
          <!-- System Message Style -->
          <div v-if="msg.sender_type === 'system'" class="w-full flex justify-center my-1.5">
            <div class="px-4 py-2 rounded-xl bg-amber-50 text-amber-900 text-xs text-center border border-amber-200 max-w-lg shadow-xs">
              ℹ️ {{ cleanTextDisplay(msg.content) }}
            </div>
          </div>

          <!-- User / Assistant / Agent Message Bubble -->
          <div v-else class="max-w-[92%] sm:max-w-[85%] space-y-1">
            <div class="flex items-center space-x-2 text-[11px] text-slate-500 px-1" :class="msg.sender_type === 'user' ? 'justify-end' : 'justify-start'">
              <span class="font-semibold" :class="msg.sender_type === 'agent' ? 'text-emerald-700' : msg.sender_type === 'assistant' ? 'text-sita-700' : 'text-slate-600'">
                {{ msg.sender_name || (msg.sender_type === 'user' ? 'Anda' : msg.sender_type === 'agent' ? 'Petugas Helpdesk' : 'SITA AI Assistant') }}
              </span>
              <span class="text-[10px] text-slate-400">{{ formatTime(msg.created_at) }}</span>
            </div>

            <div
              class="p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm"
              :class="
                msg.sender_type === 'user'
                  ? 'bg-gradient-to-r from-sita-600 to-sita-700 text-white rounded-tr-none font-medium'
                  : msg.sender_type === 'agent'
                  ? 'bg-emerald-50 text-slate-800 rounded-tl-none border border-emerald-200'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/90'
              "
            >
              <!-- Parsed Clean HTML Content -->
              <div class="chat-content leading-relaxed" :class="msg.sender_type === 'user' ? 'user-bubble' : 'bot-bubble'" v-html="formatMessage(msg.content, msg.sender_type === 'user')"></div>
            </div>

            <!-- Dynamic Quick Actions for Assistant Prompts (e.g. Ticket Offer / Ticket Number) -->
            <div
              v-if="msg.sender_type === 'assistant' && idx === chatStore.messages.length - 1 && !chatStore.isLoading && !chatStore.isAgentMode"
              class="flex flex-wrap gap-1.5 pt-1 pl-1 animate-fade-in"
            >
              <!-- Ticket Offer Quick Buttons -->
              <template v-if="isTicketOfferMessage(msg.content)">
                <button
                  @click="sendQuickAction('Ya, tolong buatkan tiketnya')"
                  class="px-3 py-1.5 rounded-xl bg-sita-600 hover:bg-sita-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1"
                >
                  <span>🎫</span>
                  <span>Ya, Tolong Buatkan Tiket</span>
                </button>
                <button
                  @click="openInlineTicketForm"
                  class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition flex items-center space-x-1 shadow-xs"
                >
                  <span>📝</span>
                  <span>Tulis Rincian Tambahan</span>
                </button>
                <button
                  @click="chatStore.requestEscalation('Pengunjung meminta bicara dengan petugas')"
                  class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-300 transition flex items-center space-x-1 shadow-xs"
                >
                  <span>👨‍💼</span>
                  <span>Bicara Petugas</span>
                </button>
              </template>

              <!-- Ticket Created Quick Buttons -->
              <template v-else-if="extractTicketCode(msg.content)">
                <button
                  @click="copyExtractedTicket(extractTicketCode(msg.content)!)"
                  class="px-3 py-1.5 rounded-xl bg-sita-50 hover:bg-sita-100 text-sita-800 font-bold text-xs border border-sita-300 transition flex items-center space-x-1 shadow-xs"
                >
                  <span>📋</span>
                  <span>{{ copiedCode ? '✓ Tersalin!' : 'Salin Kode Tiket' }}</span>
                </button>
                <button
                  @click="sendQuickAction('cek tiket')"
                  class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition flex items-center space-x-1 shadow-xs"
                >
                  <span>🔍</span>
                  <span>Cek Status Tiket</span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- INLINE SIMPLE TICKET NOTE CARD -->
        <div v-if="showInlineTicketForm" class="w-full max-w-lg mx-auto my-3 animate-fade-in">
          <div class="p-4 sm:p-5 rounded-2xl bg-white border-2 border-sita-500 shadow-xl space-y-3 text-xs">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">🎫</span>
                <span class="font-bold text-slate-900 text-sm">Catatan Tiket / Pengaduan</span>
              </div>
              <button @click="showInlineTicketForm = false" class="text-slate-400 hover:text-slate-700 text-xs">✕ Tutup</button>
            </div>

            <!-- SUCCESS STATE INLINE -->
            <div v-if="submittedTicket" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <div class="text-emerald-700 font-bold text-sm">✅ Tiket Berhasil Dibuat!</div>
              <p class="text-[11px] text-slate-600">Nomor tiket resmi Anda:</p>
              <div class="text-xl font-mono font-extrabold text-sita-700 tracking-wider">{{ submittedTicket.ticket_number }}</div>
              <div class="flex justify-center gap-2 pt-1">
                <button
                  @click="copyTicketCode"
                  class="px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition shadow-xs"
                >
                  {{ isTicketCopied ? '✓ Tersalin!' : '📋 Salin Kode' }}
                </button>
                <button
                  @click="closeSubmittedTicket"
                  class="px-3 py-1 rounded-lg bg-sita-600 hover:bg-sita-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Lanjut Chat
                </button>
              </div>
            </div>

            <!-- SIMPLE FORM (Only Notes/Description) -->
            <form v-else @submit.prevent="submitInlineTicket" class="space-y-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1.5 text-xs">
                  Tuliskan Catatan / Detail Laporan Anda:
                </label>
                <textarea
                  v-model="ticketNotes"
                  required
                  rows="3"
                  placeholder="Contoh: Dompet cokelat tertinggal di area Pantai Kuta dekat pos Balawista sekitar jam 14.00 WITA..."
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:ring-2 focus:ring-sita-500 focus:outline-none"
                ></textarea>
              </div>

              <div class="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  @click="showInlineTicketForm = false"
                  class="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="isSubmittingTicket || !ticketNotes.trim()"
                  class="px-4 py-1.5 rounded-xl font-bold text-white bg-sita-600 hover:bg-sita-700 text-xs shadow transition disabled:opacity-50"
                >
                  {{ isSubmittingTicket ? 'Menyimpan...' : 'Kirim Tiket' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="chatStore.isLoading || chatStore.isAgentTyping" class="flex items-center space-x-2 text-slate-500 text-xs px-2 py-1">
          <div class="w-8 h-8 rounded-full bg-sita-100 text-sita-700 flex items-center justify-center text-sm border border-sita-200">
            🤖
          </div>
          <div class="flex items-center space-x-1.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-sita-500 animate-bounce"></span>
            <span class="w-2 h-2 rounded-full bg-sita-500 animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-2 h-2 rounded-full bg-sita-500 animate-bounce [animation-delay:0.4s]"></span>
            <span class="text-[11px] text-slate-600 ml-1">
              {{ chatStore.isAgentTyping ? 'Petugas sedang mengetik...' : 'SITA AI sedang memproses balasan...' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Input Area -->
      <div class="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form @submit.prevent="handleSendMessage" class="flex items-center space-x-2">
          <input
            v-model="inputMessage"
            type="text"
            :disabled="chatStore.isLoading"
            :placeholder="chatStore.isAgentMode ? 'Ketik pesan langsung untuk Petugas Helpdesk...' : chatStore.isEscalationRequested ? 'Menghubungkan ke petugas... ketik pesan tambahan jika perlu...' : 'Ketik pertanyaan wisata, \'buat tiket\', \'cek tiket\', atau \'bicara dengan petugas\'...'"
            class="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs sm:text-sm transition disabled:opacity-50"
          />
          <button
            type="submit"
            :disabled="chatStore.isLoading || !inputMessage.trim()"
            class="px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-sita-600 to-sita-500 hover:from-sita-700 hover:to-sita-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sita-600/20 transition flex items-center space-x-2 text-xs sm:text-sm shrink-0"
          >
            <span>Kirim</span>
            <span>➤</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Pre-Chat Identification Modal (Appears when starting a new session) -->
    <PreChatModal
      :is-open="showPreChatModal"
      @submit="handlePreChatSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from '../stores/chatStore';
import { SessionAPI, TicketAPI } from '../services/api';
import PreChatModal from '../components/PreChatModal.vue';

const chatStore = useChatStore();

const showPreChatModal = ref(false);
const showInlineTicketForm = ref(false);
const isSubmittingTicket = ref(false);
const submittedTicket = ref<any>(null);
const isTicketCopied = ref(false);
const copiedCode = ref(false);
const ticketNotes = ref('');

const inputMessage = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);

const quickPrompts = [
  { icon: '🏖️', text: 'Apa saja destinasi wisata budaya populer di Badung?' },
  { icon: '🔥', text: 'Kapan tradisi Siat Geni di Tuban dan tradisi Mekotek diselenggarakan?' },
  { icon: '📱', text: 'Saya kehilangan HP di Uluwatu' },
  { icon: '🔍', text: 'Cek status tiket saya' },
  { icon: '👨‍💼', text: 'Saya ingin bicara dengan petugas langsung' },
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom();
  }
);

onMounted(async () => {
  const resumed = await chatStore.resumeSavedSession();
  if (!resumed) {
    showPreChatModal.value = true;
  } else {
    scrollToBottom();
  }
});

const handlePreChatSubmit = async (data: { visitorName: string; visitorEmail: string; visitorPhone: string }) => {
  await chatStore.initSession(data);
  showPreChatModal.value = false;
  scrollToBottom();
};

const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) return;
  const txt = inputMessage.value.trim();
  inputMessage.value = '';

  const lower = txt.toLowerCase();

  // Natural language escalation
  if (lower.includes('bicara dengan petugas') || lower.includes('hubungi petugas') || lower.includes('human agent')) {
    await chatStore.requestEscalation('Pengunjung meminta bicara dengan petugas langsung');
    scrollToBottom();
    return;
  }

  // Trigger inline simple ticket form
  if (
    lower.includes('buka form') ||
    lower.includes('isi formulir tiket') ||
    lower.includes('form pengaduan')
  ) {
    showInlineTicketForm.value = true;
    submittedTicket.value = null;
    ticketNotes.value = '';
  }

  await chatStore.sendMessage(txt);
  scrollToBottom();
};

const sendQuickPrompt = (prompt: { text: string }) => {
  inputMessage.value = prompt.text;
  handleSendMessage();
};

const sendQuickAction = (text: string) => {
  inputMessage.value = text;
  handleSendMessage();
};

const openInlineTicketForm = () => {
  showInlineTicketForm.value = true;
  submittedTicket.value = null;
  ticketNotes.value = '';
};

const isTicketOfferMessage = (content?: string): boolean => {
  if (!content) return false;
  const lower = content.toLowerCase();
  return (
    lower.includes('buatkan tiket') ||
    lower.includes('tolong buatkan') ||
    lower.includes('bantu buatkan tiket') ||
    lower.includes('tiket laporan kehilangan')
  ) && !lower.includes('nomor tiket:');
};

const extractTicketCode = (content?: string): string | null => {
  if (!content) return null;
  const match = content.match(/TKT-\d{6}-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
};

const copyExtractedTicket = (code: string) => {
  navigator.clipboard.writeText(code);
  copiedCode.value = true;
  setTimeout(() => {
    copiedCode.value = false;
  }, 2000);
};

const submitInlineTicket = async () => {
  if (!ticketNotes.value.trim()) return;
  isSubmittingTicket.value = true;
  try {
    const res = await TicketAPI.create({
      notes: ticketNotes.value.trim(),
      description: ticketNotes.value.trim(),
      sessionId: chatStore.session?.id,
      name: chatStore.session?.visitor_name,
      email: chatStore.session?.visitor_email,
      phone: chatStore.session?.visitor_phone,
    });
    submittedTicket.value = res.data.ticket;

    // Refresh chat messages
    if (chatStore.session?.id) {
      const refreshed = await SessionAPI.get(chatStore.session.id);
      chatStore.messages = refreshed.data.messages || [];
    }
  } catch (err: any) {
    alert(err?.response?.data?.error || 'Gagal membuat tiket.');
  } finally {
    isSubmittingTicket.value = false;
  }
};

const copyTicketCode = () => {
  if (submittedTicket.value?.ticket_number) {
    navigator.clipboard.writeText(submittedTicket.value.ticket_number);
    isTicketCopied.value = true;
    setTimeout(() => {
      isTicketCopied.value = false;
    }, 2000);
  }
};

const closeSubmittedTicket = () => {
  showInlineTicketForm.value = false;
  submittedTicket.value = null;
  ticketNotes.value = '';
};

const handleCloseSession = async () => {
  if (confirm('Tutup sesi obrolan saat ini? Anda akan diarahkan untuk memulai sesi baru dari awal.')) {
    if (chatStore.session?.id) {
      try {
        await SessionAPI.close(chatStore.session.id, 'Sesi ditutup oleh pengunjung.');
      } catch (e) {
        // Ignore network error on close
      }
    }
    chatStore.resetSession();
    showPreChatModal.value = true;
  }
};

/**
 * Clean & modern markdown formatter for webchat
 */
const formatMessage = (content: string, isUser: boolean = false): string => {
  if (!content) return '';
  let text = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Convert ### or ## titles to clean bold highlight headers
    .replace(/^###\s+(.*$)/gim, `<span class="block font-bold ${isUser ? 'text-white' : 'text-sita-800'} mt-2 mb-1">$1</span>`)
    .replace(/^##\s+(.*$)/gim, `<span class="block font-bold ${isUser ? 'text-white' : 'text-sita-800'} mt-2 mb-1">$1</span>`)
    // Convert bullet lists
    .replace(/^[•\-]\s+(.*$)/gim, `<div class="flex items-start space-x-1.5 my-0.5"><span class="${isUser ? 'text-white' : 'text-sita-600'} font-bold shrink-0">•</span><span>$1</span></div>`)
    // Bold
    .replace(/\*\*(.*?)\*\*/g, `<strong class="font-bold ${isUser ? 'text-white' : 'text-slate-900'}">$1</strong>`)
    .replace(/\*(.*?)\*/g, `<strong class="font-semibold ${isUser ? 'text-slate-100' : 'text-slate-800'}">$1</strong>`)
    // Highlight ticket numbers
    .replace(/(TKT-\d{6}-\d{4})/g, `<code class="${isUser ? 'bg-white/20 text-white' : 'bg-sita-50 text-sita-800 border border-sita-200'} px-2 py-0.5 rounded font-mono text-xs font-bold">$1</code>`)
    // Code blocks
    .replace(/`([^`]+)`/g, `<code class="${isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'} px-1.5 py-0.5 rounded font-mono text-xs font-bold">$1</code>`)
    // Newlines
    .replace(/\n\n/g, '<div class="my-1.5"></div>')
    .replace(/\n/g, '<br/>');
  return text;
};

const cleanTextDisplay = (content: string): string => {
  if (!content) return '';
  return content.replace(/\*\*/g, '').replace(/\*/g, '');
};

const formatTime = (dt?: string) => {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.bot-bubble :deep(strong) {
  font-weight: 700;
  color: #0f172a;
}
.user-bubble :deep(strong) {
  font-weight: 700;
  color: #ffffff;
}
</style>
