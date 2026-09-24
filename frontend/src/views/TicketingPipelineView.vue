<template>
  <div class="max-w-7xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-4.5rem)] flex flex-col">
    <!-- Header & Search Toolbar -->
    <div class="glass-panel rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/90 shadow-sm bg-white/95">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center text-xl border border-gold-200">
          🎫
        </div>
        <div>
          <h2 class="font-extrabold text-slate-900 text-base">Pipeline & Kanban Tiket Layanan</h2>
          <p class="text-xs text-slate-500">Pantau penanganan laporan kehilangan barang & aduan pariwisata Badung</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <input
            v-model="searchKeyword"
            @input="fetchTickets"
            type="text"
            placeholder="Cari Nomor Tiket / Nama..."
            class="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 w-48 sm:w-60"
          />
          <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        <select
          v-model="selectedCategory"
          @change="fetchTickets"
          class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500"
        >
          <option value="">Semua Kategori</option>
          <option value="kehilangan_barang">Kehilangan Barang</option>
          <option value="fasilitas">Pengaduan Fasilitas</option>
          <option value="keluhan">Keluhan Layanan</option>
          <option value="informasi">Informasi Khusus</option>
        </select>

        <button
          @click="fetchTickets"
          class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition text-xs border border-slate-200"
          title="Segarkan Pipeline"
        >
          🔄
        </button>
      </div>
    </div>

    <!-- Kanban Board Columns -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto overflow-y-hidden pb-2">
      <!-- 1. OPEN -->
      <div class="glass-panel rounded-2xl flex flex-col border border-blue-200 shadow-xs bg-slate-50/70 min-w-[240px]">
        <div class="p-3 border-b border-blue-100 flex items-center justify-between bg-blue-50/80 rounded-t-2xl">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span class="font-bold text-xs text-blue-950 uppercase tracking-wider">Baru / Open</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
            {{ getColumnTickets('OPEN').length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          <div
            v-for="t in getColumnTickets('OPEN')"
            :key="t.id"
            @click="openTicketDrawer(t)"
            class="p-3 rounded-xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-blue-400 transition cursor-pointer space-y-2 shadow-2xs"
          >
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-sita-700">{{ t.ticket_number }}</span>
              <span class="font-bold px-1.5 py-0.5 rounded" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs line-clamp-2">{{ t.subject }}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2">{{ t.description }}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
              <span class="truncate max-w-[100px]">👤 {{ t.name }}</span>
              <span>{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. IN_PROGRESS -->
      <div class="glass-panel rounded-2xl flex flex-col border border-amber-200 shadow-xs bg-slate-50/70 min-w-[240px]">
        <div class="p-3 border-b border-amber-100 flex items-center justify-between bg-amber-50/80 rounded-t-2xl">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="font-bold text-xs text-amber-950 uppercase tracking-wider">Diproses</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
            {{ getColumnTickets('IN_PROGRESS').length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          <div
            v-for="t in getColumnTickets('IN_PROGRESS')"
            :key="t.id"
            @click="openTicketDrawer(t)"
            class="p-3 rounded-xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-amber-400 transition cursor-pointer space-y-2 shadow-2xs"
          >
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-sita-700">{{ t.ticket_number }}</span>
              <span class="font-bold px-1.5 py-0.5 rounded" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs line-clamp-2">{{ t.subject }}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2">{{ t.description }}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
              <span class="truncate max-w-[100px]">👤 {{ t.name }}</span>
              <span>{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ESCALATED -->
      <div class="glass-panel rounded-2xl flex flex-col border border-purple-200 shadow-xs bg-slate-50/70 min-w-[240px]">
        <div class="p-3 border-b border-purple-100 flex items-center justify-between bg-purple-50/80 rounded-t-2xl">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span class="font-bold text-xs text-purple-950 uppercase tracking-wider">Eskalasi Khusus</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
            {{ getColumnTickets('ESCALATED').length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          <div
            v-for="t in getColumnTickets('ESCALATED')"
            :key="t.id"
            @click="openTicketDrawer(t)"
            class="p-3 rounded-xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-purple-400 transition cursor-pointer space-y-2 shadow-2xs"
          >
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-sita-700">{{ t.ticket_number }}</span>
              <span class="font-bold px-1.5 py-0.5 rounded" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs line-clamp-2">{{ t.subject }}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2">{{ t.description }}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
              <span class="truncate max-w-[100px]">👤 {{ t.name }}</span>
              <span>{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. RESOLVED -->
      <div class="glass-panel rounded-2xl flex flex-col border border-emerald-200 shadow-xs bg-slate-50/70 min-w-[240px]">
        <div class="p-3 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/80 rounded-t-2xl">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-xs text-emerald-950 uppercase tracking-wider">Selesai / Resolved</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            {{ getColumnTickets('RESOLVED').length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          <div
            v-for="t in getColumnTickets('RESOLVED')"
            :key="t.id"
            @click="openTicketDrawer(t)"
            class="p-3 rounded-xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-emerald-400 transition cursor-pointer space-y-2 shadow-2xs"
          >
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-emerald-700">{{ t.ticket_number }}</span>
              <span class="font-bold px-1.5 py-0.5 rounded" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs line-clamp-2">{{ t.subject }}</h4>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
              <span class="truncate max-w-[100px]">👤 {{ t.name }}</span>
              <span>{{ formatDate(t.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. CLOSED -->
      <div class="glass-panel rounded-2xl flex flex-col border border-slate-200 shadow-xs bg-slate-50/70 min-w-[240px]">
        <div class="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100 rounded-t-2xl">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span class="font-bold text-xs text-slate-700 uppercase tracking-wider">Ditutup (Closed)</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
            {{ getColumnTickets('CLOSED').length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          <div
            v-for="t in getColumnTickets('CLOSED')"
            :key="t.id"
            @click="openTicketDrawer(t)"
            class="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer space-y-2 shadow-2xs opacity-75 hover:opacity-100"
          >
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-slate-500">{{ t.ticket_number }}</span>
              <span class="font-bold px-1.5 py-0.5 rounded" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
            <h4 class="font-semibold text-slate-700 text-xs line-clamp-1">{{ t.subject }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Detail Drawer / Modal -->
    <div v-if="selectedTicket" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div class="glass-panel w-full max-w-2xl rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 bg-white relative max-h-[90vh] flex flex-col">
        <button @click="selectedTicket = null" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1">✕</button>

        <div class="flex items-center space-x-3 mb-4">
          <span class="text-2xl">🎫</span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono font-extrabold text-sita-700 text-lg">{{ selectedTicket.ticket_number }}</span>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full" :class="getPriorityBadge(selectedTicket.priority)">
                {{ selectedTicket.priority }}
              </span>
            </div>
            <span class="text-xs text-slate-500">Dibuat pada {{ formatDate(selectedTicket.created_at) }}</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          <!-- Reporter Info -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold block">Pelapor</span>
              <span class="font-bold text-slate-900 text-xs">{{ selectedTicket.name }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold block">Email</span>
              <span class="text-slate-700 truncate block">{{ selectedTicket.email }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold block">No. HP / WA</span>
              <span class="text-slate-700">{{ selectedTicket.phone }}</span>
            </div>
          </div>

          <!-- Subject & Description -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 class="text-sm font-bold text-slate-900">{{ selectedTicket.subject }}</h4>
            <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{{ selectedTicket.description }}</p>
            <div v-if="selectedTicket.location_details" class="text-[11px] text-gold-700 pt-1 font-semibold">
              📍 Lokasi: <strong>{{ selectedTicket.location_details }}</strong>
            </div>
          </div>

          <!-- Pipeline Status Switcher -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">Perbarui Status Pipeline:</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="st in ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED']"
                :key="st"
                @click="updateStatus(st)"
                class="px-3 py-1.5 rounded-xl font-bold text-xs transition"
                :class="selectedTicket.status === st ? 'bg-sita-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
              >
                {{ st }}
              </button>
            </div>
          </div>

          <!-- Activity / Comment Threads -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">Catatan & Riwayat Tindak Lanjut:</span>
            <div v-for="c in ticketComments" :key="c.id" class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="font-bold text-sita-700">{{ c.sender_name }}</span>
                <span class="text-slate-400 text-[10px]">{{ formatDate(c.created_at) }}</span>
              </div>
              <p class="text-slate-700 text-xs whitespace-pre-wrap">{{ c.comment_text }}</p>
            </div>
          </div>

          <!-- Add Note / Comment Box -->
          <form @submit.prevent="handleAddComment" class="flex gap-2">
            <input
              v-model="commentInput"
              type="text"
              placeholder="Tambahkan catatan tindak lanjut internal atau balasan..."
              class="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500"
            />
            <button
              type="submit"
              :disabled="!commentInput.trim()"
              class="px-4 py-2 rounded-xl bg-sita-600 hover:bg-sita-700 text-white font-bold text-xs transition disabled:opacity-50 shadow-sm"
            >
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TicketAPI } from '../services/api';

const tickets = ref<any[]>([]);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedTicket = ref<any>(null);
const ticketComments = ref<any[]>([]);
const commentInput = ref('');

const fetchTickets = async () => {
  try {
    const res = await TicketAPI.list({
      search: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
    });
    tickets.value = res.data.tickets || [];
  } catch (err) {
    console.error('Failed to fetch tickets:', err);
  }
};

const getColumnTickets = (status: string) => {
  return tickets.value.filter((t) => t.status === status);
};

const openTicketDrawer = async (ticket: any) => {
  selectedTicket.value = ticket;
  try {
    const res = await TicketAPI.get(ticket.id);
    ticketComments.value = res.data.comments || [];
  } catch (err) {
    console.error('Failed to get ticket comments:', err);
  }
};

const updateStatus = async (newStatus: string) => {
  if (!selectedTicket.value) return;
  try {
    await TicketAPI.updateStatus(selectedTicket.value.id, {
      status: newStatus,
      senderName: 'Petugas Helpdesk',
      commentText: `Status digeser ke ${newStatus}`,
    });
    selectedTicket.value.status = newStatus;
    await fetchTickets();
    const commentsRes = await TicketAPI.get(selectedTicket.value.id);
    ticketComments.value = commentsRes.data.comments || [];
  } catch (err) {
    alert('Gagal memperbarui status tiket.');
  }
};

const handleAddComment = async () => {
  if (!selectedTicket.value || !commentInput.value.trim()) return;
  try {
    await TicketAPI.addComment(selectedTicket.value.id, {
      senderName: 'Petugas Helpdesk',
      senderType: 'agent',
      commentText: commentInput.value.trim(),
    });
    commentInput.value = '';
    const commentsRes = await TicketAPI.get(selectedTicket.value.id);
    ticketComments.value = commentsRes.data.comments || [];
  } catch (err) {
    alert('Gagal menambahkan komentar.');
  }
};

onMounted(() => {
  fetchTickets();
});

const getPriorityBadge = (p: string) => {
  switch (p) {
    case 'URGENT':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const formatDate = (dt?: string) => {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};
</script>
