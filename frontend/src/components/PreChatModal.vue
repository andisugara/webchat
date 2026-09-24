<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
    <div class="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 bg-white relative overflow-hidden">
      <!-- Glow background accent -->
      <div class="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-sita-500/10 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-gold-500/10 blur-3xl pointer-events-none"></div>

      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-sita-600 to-sita-500 flex items-center justify-center text-3xl shadow-md shadow-sita-600/20 border border-sita-300/40 text-white animate-bounce-subtle">
          🏝️
        </div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat Datang di SITA Badung</h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
          Silakan lengkapi data singkat Anda untuk memulai sesi obrolan interaktif bersama Asisten Virtual & Helpdesk Pariwisata Badung.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nama Lengkap <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">👤</span>
            <input
              v-model="form.visitorName"
              type="text"
              required
              placeholder="Contoh: I Kadek Suardana"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-sm transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Alamat Email <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">✉️</span>
            <input
              v-model="form.visitorEmail"
              type="email"
              required
              placeholder="nama@email.com"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-sm transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nomor WhatsApp / HP <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">📱</span>
            <input
              v-model="form.visitorPhone"
              type="tel"
              required
              placeholder="08123456789"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-sm transition"
            />
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Data Anda otomatis digunakan jika sewaktu-waktu membuat tiket pengaduan/layanan.</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-sita-600 to-sita-500 hover:from-sita-700 hover:to-sita-600 shadow-md shadow-sita-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 text-sm"
        >
          <span v-if="!isSubmitting">Mulai Percakapan</span>
          <span v-else class="flex items-center space-x-2">
            <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Menghubungkan...</span>
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: { visitorName: string; visitorEmail: string; visitorPhone: string }): void;
}>();

const form = ref({
  visitorName: '',
  visitorEmail: '',
  visitorPhone: '',
});

const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!form.value.visitorName || !form.value.visitorEmail || !form.value.visitorPhone) return;
  isSubmitting.value = true;
  try {
    emit('submit', { ...form.value });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
