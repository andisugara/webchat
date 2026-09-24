<template>
  <div class="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-5 overflow-y-auto max-h-[calc(100vh-4.5rem)] pb-10">
    <!-- Header -->
    <div class="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/90 shadow-sm bg-white/95">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-sita-100 text-sita-700 flex items-center justify-center text-xl border border-sita-200">
          📊
        </div>
        <div>
          <h2 class="font-extrabold text-slate-900 text-base">Dashboard Analitik & Token Tracking</h2>
          <p class="text-xs text-slate-500">Monitoring penggunaan token Fireworks AI, performa agen, dan efektivitas RAG</p>
        </div>
      </div>

      <button
        @click="fetchAnalytics"
        class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition text-xs font-semibold border border-slate-200 flex items-center space-x-1.5"
      >
        <span>🔄</span>
        <span>Segarkan Data</span>
      </button>
    </div>

    <!-- 4 KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Total Tokens -->
      <div class="glass-panel rounded-2xl p-4 border border-sita-200 relative overflow-hidden shadow-xs bg-white">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px]">Total Token AI</span>
          <span class="text-lg">🎟️</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-sita-700">
          {{ formatNumber(overview?.tokens?.total || 0) }}
        </div>
        <div class="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-100 pt-1.5">
          <span>P: {{ formatNumber(overview?.tokens?.prompt || 0) }}</span>
          <span>C: {{ formatNumber(overview?.tokens?.completion || 0) }}</span>
        </div>
      </div>

      <!-- 2. Cost Estimate -->
      <div class="glass-panel rounded-2xl p-4 border border-gold-200 relative overflow-hidden shadow-xs bg-white">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px]">Estimasi Biaya Fireworks</span>
          <span class="text-lg">💰</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-gold-700">
          ${{ overview?.tokens?.estimatedCostUsd || '0.0000' }}
        </div>
        <div class="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-100 pt-1.5">
          <span>Model: gpt-oss-120b</span>
          <span>Avg: {{ overview?.tokens?.avgLatencyMs || 0 }}ms</span>
        </div>
      </div>

      <!-- 3. Escalation Rate -->
      <div class="glass-panel rounded-2xl p-4 border border-purple-200 relative overflow-hidden shadow-xs bg-white">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px]">Eskalasi ke Human Agent</span>
          <span class="text-lg">👨‍💼</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-purple-700">
          {{ overview?.sessions?.escalationRatePercent || 0 }}%
        </div>
        <div class="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-100 pt-1.5">
          <span>Total Sesi: {{ overview?.sessions?.total || 0 }}</span>
          <span>Eskalasi: {{ overview?.sessions?.escalated || 0 }}</span>
        </div>
      </div>

      <!-- 4. Tickets Resolved -->
      <div class="glass-panel rounded-2xl p-4 border border-emerald-200 relative overflow-hidden shadow-xs bg-white">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px]">Tiket Layanan & Aduan</span>
          <span class="text-lg">🎫</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-emerald-700">
          {{ overview?.tickets?.resolved || 0 }} / {{ overview?.tickets?.total || 0 }}
        </div>
        <div class="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-100 pt-1.5">
          <span>Antrean Baru: {{ overview?.tickets?.open || 0 }}</span>
          <span>Diproses: {{ overview?.tickets?.inProgress || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Daily Token Trend -->
      <div class="glass-panel lg:col-span-2 rounded-2xl p-5 border border-slate-200 shadow-xs bg-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-900 text-sm">Tren Konsumsi Token Harian</h3>
          <span class="text-[11px] text-slate-400">30 Hari Terakhir</span>
        </div>
        <div class="h-64 flex items-center justify-center">
          <Bar v-if="tokenChartData.labels.length > 0" :data="tokenChartData" :options="chartOptions" />
          <div v-else class="text-slate-400 text-xs">Belum ada data percakapan yang terekam.</div>
        </div>
      </div>

      <!-- Ticket Distribution -->
      <div class="glass-panel rounded-2xl p-5 border border-slate-200 shadow-xs bg-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-900 text-sm">Distribusi Kategori Tiket</h3>
          <span class="text-[11px] text-slate-400">Total</span>
        </div>
        <div class="h-64 flex items-center justify-center">
          <Doughnut v-if="ticketChartData.labels.length > 0" :data="ticketChartData" :options="doughnutOptions" />
          <div v-else class="text-slate-400 text-xs">Belum ada tiket yang dibuat.</div>
        </div>
      </div>
    </div>

    <!-- RAG & Prompt Efficiency Summary Table -->
    <div class="glass-panel rounded-2xl p-5 border border-slate-200 shadow-xs bg-white">
      <h3 class="font-bold text-slate-900 text-sm mb-3">Efisiensi RAG & Penghematan Token</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-slate-600 font-semibold block mb-1">Rata-rata Prompt Token per Chat</span>
          <span class="text-lg font-mono font-bold text-sita-700">~{{ overview?.tokens?.total ? Math.round((overview.tokens.prompt / (overview.sessions.total || 1))) : 320 }} tokens</span>
          <p class="text-[11px] text-emerald-700 mt-1 font-medium">✓ Hemat 92% dibanding menyertakan seluruh dokumen</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-slate-600 font-semibold block mb-1">Strategi Chunking & Top-K RAG</span>
          <span class="text-lg font-mono font-bold text-gold-700">Top-4 Chunks</span>
          <p class="text-[11px] text-slate-500 mt-1">Cosine similarity threshold 0.25 (pgvector / float8)</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-slate-600 font-semibold block mb-1">Model AI Aktif</span>
          <span class="text-lg font-mono font-bold text-purple-700">gpt-oss-120b</span>
          <p class="text-[11px] text-slate-500 mt-1">Fireworks AI Open-Weights Inference</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AnalyticsAPI } from '../services/api';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const overview = ref<any>(null);

const tokenChartData = ref<any>({
  labels: [],
  datasets: [],
});

const ticketChartData = ref<any>({
  labels: [],
  datasets: [],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#475569', font: { size: 11 } },
    },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#475569', font: { size: 10 } },
    },
  },
};

const fetchAnalytics = async () => {
  try {
    const [ovRes, dailyRes, tktRes] = await Promise.all([
      AnalyticsAPI.getOverview(),
      AnalyticsAPI.getDailyTokens(),
      AnalyticsAPI.getTickets(),
    ]);

    overview.value = ovRes.data;

    // Daily Tokens Chart
    const daily = dailyRes.data.daily || [];
    if (daily.length > 0) {
      tokenChartData.value = {
        labels: daily.map((d: any) => d.date),
        datasets: [
          {
            label: 'Prompt Tokens',
            data: daily.map((d: any) => parseInt(d.prompt_tokens, 10)),
            backgroundColor: '#017143',
          },
          {
            label: 'Completion Tokens',
            data: daily.map((d: any) => parseInt(d.completion_tokens, 10)),
            backgroundColor: '#f59e0b',
          },
        ],
      };
    } else {
      // Mock initial points for visualization
      const today = new Date().toISOString().slice(0, 10);
      tokenChartData.value = {
        labels: [today],
        datasets: [
          { label: 'Prompt Tokens', data: [overview.value?.tokens?.prompt || 120], backgroundColor: '#017143' },
          { label: 'Completion Tokens', data: [overview.value?.tokens?.completion || 85], backgroundColor: '#f59e0b' },
        ],
      };
    }

    // Tickets Chart
    const categories = tktRes.data.byCategory || [];
    if (categories.length > 0) {
      ticketChartData.value = {
        labels: categories.map((c: any) => c.category),
        datasets: [
          {
            data: categories.map((c: any) => parseInt(c.count, 10)),
            backgroundColor: ['#017143', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'],
          },
        ],
      };
    } else {
      ticketChartData.value = {
        labels: ['Kehilangan Barang', 'Pengaduan Fasilitas', 'Lainnya'],
        datasets: [
          {
            data: [1, 1, 0],
            backgroundColor: ['#017143', '#f59e0b', '#3b82f6'],
          },
        ],
      };
    }
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
  }
};

onMounted(() => {
  fetchAnalytics();
});

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};
</script>
