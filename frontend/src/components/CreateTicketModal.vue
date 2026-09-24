<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
    <div class="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 bg-white relative overflow-hidden max-h-[90vh] overflow-y-auto">
      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
      >
        ✕
      </button>

      <!-- SUCCESS STATE -->
      <div v-if="createdTicket" class="text-center py-4 space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl border border-emerald-200">
          ✅
        </div>
        <h3 class="text-xl font-bold text-slate-900">Tiket Berhasil Dibuat!</h3>
        <p class="text-xs sm:text-sm text-slate-600">
          Laporan Anda telah berhasil dicatat ke dalam antrean sistem pelayanan Dinas Pariwisata Badung.
        </p>

        <div class="p-4 rounded-xl bg-slate-50 border border-sita-300 text-center space-y-1">
          <span class="text-xs uppercase font-semibold tracking-wider text-sita-700">Kode / Nomor Tiket Anda</span>
          <div class="text-2xl font-mono font-black text-slate-900 tracking-widest">{{ createdTicket.ticket_number }}</div>
          <p class="text-[11px] text-slate-500">Simpan nomor ini untuk mengecek status tindak lanjut kapan saja.</p>
        </div>

        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            @click="copyTicketNumber"
            class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center space-x-2 border border-slate-300"
          >
            <span>{{ isCopied ? '✓ Tersalin!' : '📋 Salin Nomor Tiket' }}</span>
          </button>
          <button
            @click="handleDone"
            class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-sita-600 hover:bg-sita-700 text-white transition flex items-center justify-center space-x-2 shadow-md shadow-sita-600/20"
          >
            <span>Lanjutkan Obrolan</span>
          </button>
        </div>
      </div>

      <!-- FORM STATE -->
      <div v-else>
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-sita-100 text-sita-700 flex items-center justify-center text-xl border border-sita-200">
            🎫
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Buat Tiket Layanan / Pengaduan</h3>
            <p class="text-xs text-slate-500">Laporan kehilangan barang, aduan fasilitas, atau permohonan khusus</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs sm:text-sm">
          <!-- Pre-filled info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Pelapor (Otomatis)</span>
              <span class="font-medium text-slate-800">{{ form.name }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Kontak / Email</span>
              <span class="font-medium text-slate-800 truncate block">{{ form.email }} • {{ form.phone }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Kategori Tiket <span class="text-red-500">*</span></label>
              <select
                v-model="form.category"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
              >
                <option value="kehilangan_barang">🔍 Kehilangan Barang di Kawasan Wisata</option>
                <option value="fasilitas">⚠️ Pengaduan Fasilitas / Kebersihan</option>
                <option value="keluhan">📢 Keluhan Pelayanan Pariwisata</option>
                <option value="informasi">ℹ️ Permintaan Informasi Khusus</option>
                <option value="lainnya">📝 Lainnya</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
              <select
                v-model="form.priority"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
              >
                <option value="LOW">Biasa (Low)</option>
                <option value="MEDIUM">Menengah (Medium)</option>
                <option value="HIGH">Tinggi / Butuh Cepat (High)</option>
                <option value="URGENT">Mendesak / Darurat (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Lokasi / Destinasi Terkait</label>
            <input
              v-model="form.locationDetails"
              type="text"
              placeholder="Contoh: Pantai Kuta, Dekat Pos Balawista 2"
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Judul / Subjek Tiket <span class="text-red-500">*</span></label>
            <input
              v-model="form.subject"
              type="text"
              required
              placeholder="Contoh: Dompet Tertinggal di Area Parkir Pura Taman Ayun"
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Deskripsi Lengkap <span class="text-red-500">*</span></label>
            <textarea
              v-model="form.description"
              required
              rows="3"
              placeholder="Jelaskan kronologi, ciri-ciri barang (jika kehilangan), waktu kejadian, atau detail keluhan secara spesifik..."
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs leading-relaxed"
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl font-bold text-white bg-sita-600 hover:bg-sita-700 shadow-md shadow-sita-600/20 transition text-xs flex items-center space-x-1.5"
            >
              <span v-if="!isSubmitting">Kirim Tiket Resmi</span>
              <span v-else>Memproses...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { TicketAPI } from '../services/api';

const props = defineProps<{
  isOpen: boolean;
  sessionId?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', ticket: any): void;
}>();

const form = ref({
  name: props.visitorName || '',
  email: props.visitorEmail || '',
  phone: props.visitorPhone || '',
  category: 'kehilangan_barang',
  priority: 'MEDIUM',
  locationDetails: '',
  subject: '',
  description: '',
});

watch(
  () => [props.visitorName, props.visitorEmail, props.visitorPhone],
  ([name, email, phone]) => {
    if (name) form.value.name = name;
    if (email) form.value.email = email;
    if (phone) form.value.phone = phone;
  }
);

const isSubmitting = ref(false);
const createdTicket = ref<any>(null);
const isCopied = ref(false);

const handleSubmit = async () => {
  if (!form.value.subject || !form.value.description) return;
  isSubmitting.value = true;
  try {
    const res = await TicketAPI.create({
      ...form.value,
      sessionId: props.sessionId,
    });
    createdTicket.value = res.data.ticket;
    emit('created', res.data.ticket);
  } catch (err: any) {
    alert(err?.response?.data?.error || 'Gagal membuat tiket.');
  } finally {
    isSubmitting.value = false;
  }
};

const copyTicketNumber = () => {
  if (createdTicket.value?.ticket_number) {
    navigator.clipboard.writeText(createdTicket.value.ticket_number);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
  }
};

const handleDone = () => {
  createdTicket.value = null;
  emit('close');
};
</script>
