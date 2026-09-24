<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
    <div class="glass-panel w-full max-w-2xl rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 bg-white relative overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition z-10"
      >
        ✕
      </button>

      <div class="flex items-center space-x-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center text-xl border border-gold-200">
          🔍
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-900">Lacak & Cek Status Tiket</h3>
          <p class="text-xs text-slate-500">Cari berdasarkan Nomor Tiket, atau masukkan Email / No. HP Anda</p>
        </div>
      </div>

      <!-- Search Filters -->
      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-3">
        <div class="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            @click="searchMode = 'number'"
            class="px-3 py-1.5 rounded-lg font-semibold transition"
            :class="searchMode === 'number' ? 'bg-sita-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'"
          >
            Cari Nomor Tiket
          </button>
          <button
            type="button"
            @click="searchMode = 'contact'"
            class="px-3 py-1.5 rounded-lg font-semibold transition"
            :class="searchMode === 'contact' ? 'bg-sita-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'"
          >
            Cari via Email / No. HP
          </button>
        </div>

        <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row gap-2">
          <div v-if="searchMode === 'number'" class="flex-1">
            <input
              v-model="searchQuery.ticketNumber"
              type="text"
              placeholder="Masukkan Nomor Tiket (cth: TKT-202609-0001)"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
          </div>
          <div v-else class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              v-model="searchQuery.email"
              type="email"
              placeholder="Alamat Email Anda"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
            <input
              v-model="searchQuery.phone"
              type="text"
              placeholder="Nomor HP / WhatsApp"
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
          </div>

          <button
            type="submit"
            :disabled="isSearching"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-sita-600 hover:bg-sita-700 transition text-xs flex items-center justify-center space-x-1.5 shadow-sm shrink-0"
          >
            <span>{{ isSearching ? 'Mencari...' : 'Cari Tiket' }}</span>
          </button>
        </form>
      </div>

      <!-- Results List -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-1">
        <div v-if="hasSearched && tickets.length === 0" class="text-center py-8 text-slate-400 text-xs">
          <span class="text-3xl block mb-2">📭</span>
          Tidak ditemukan tiket yang cocok dengan data pencarian tersebut.
        </div>

        <div v-for="ticket in tickets" :key="ticket.id" class="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-sita-400 transition">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-sita-700 text-sm">{{ ticket.ticket_number }}</span>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" :class="getStatusBadgeClass(ticket.status)">
                {{ formatStatus(ticket.status) }}
              </span>
              <span class="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {{ formatCategory(ticket.category) }}
              </span>
            </div>
            <span class="text-[11px] text-slate-400">{{ formatDate(ticket.created_at) }}</span>
          </div>

          <h4 class="font-bold text-slate-900 text-sm mb-1">{{ ticket.subject }}</h4>
          <p class="text-xs text-slate-600 line-clamp-2 mb-2.5">{{ ticket.description }}</p>

          <div v-if="ticket.location_details" class="text-[11px] text-slate-500 mb-2">
            📍 <strong>Lokasi:</strong> {{ ticket.location_details }}
          </div>

          <!-- Timeline / Comments -->
          <div v-if="ticket.comments && ticket.comments.length > 0" class="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <span class="text-[10px] uppercase font-bold text-slate-600 block">Riwayat Penanganan & Balasan:</span>
            <div
              v-for="comment in ticket.comments"
              :key="comment.id"
              class="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1 shadow-2xs"
            >
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-semibold text-sita-700">{{ comment.sender_name }} ({{ comment.sender_type === 'agent' ? 'Petugas' : 'Sistem' }})</span>
                <span class="text-slate-400 text-[10px]">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="text-slate-700 text-xs whitespace-pre-wrap">{{ comment.comment_text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { TicketAPI } from '../services/api';

const props = defineProps<{
  isOpen: boolean;
  defaultEmail?: string;
  defaultPhone?: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const searchMode = ref<'number' | 'contact'>('number');
const searchQuery = ref({
  ticketNumber: '',
  email: props.defaultEmail || '',
  phone: props.defaultPhone || '',
});

watch(
  () => [props.defaultEmail, props.defaultPhone],
  ([email, phone]) => {
    if (email) searchQuery.value.email = email;
    if (phone) searchQuery.value.phone = phone;
  }
);

const isSearching = ref(false);
const hasSearched = ref(false);
const tickets = ref<any[]>([]);

const handleSearch = async () => {
  isSearching.value = true;
  hasSearched.value = true;
  try {
    const params: any = {};
    if (searchMode.value === 'number') {
      params.ticketNumber = searchQuery.value.ticketNumber;
    } else {
      params.email = searchQuery.value.email;
      params.phone = searchQuery.value.phone;
    }

    const res = await TicketAPI.track(params);
    tickets.value = res.data.tickets || [];
  } catch (err: any) {
    alert(err?.response?.data?.error || 'Gagal mencari tiket.');
  } finally {
    isSearching.value = false;
  }
};

const formatStatus = (st: string) => {
  const map: Record<string, string> = {
    OPEN: 'Menunggu Antrean (Open)',
    IN_PROGRESS: 'Sedang Ditangani',
    ESCALATED: 'Eskalasi Khusus',
    RESOLVED: 'Telah Selesai',
    CLOSED: 'Ditutup',
  };
  return map[st] || st;
};

const getStatusBadgeClass = (st: string) => {
  switch (st) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'ESCALATED':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'RESOLVED':
    case 'CLOSED':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const formatCategory = (cat: string) => {
  const map: Record<string, string> = {
    kehilangan_barang: 'Kehilangan Barang',
    fasilitas: 'Pengaduan Fasilitas',
    keluhan: 'Keluhan Layanan',
    informasi: 'Informasi Khusus',
    lainnya: 'Lainnya',
  };
  return map[cat] || cat;
};

const formatDate = (dt?: string) => {
  if (!dt) return '';
  return new Date(dt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
</script>
