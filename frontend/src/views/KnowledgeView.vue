<template>
  <div class="max-w-7xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-4.5rem)] flex flex-col">
    <!-- Toolbar -->
    <div class="glass-panel rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/90 shadow-sm bg-white/95">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-sita-100 text-sita-700 flex items-center justify-center text-xl border border-sita-200">
          📚
        </div>
        <div>
          <h2 class="font-extrabold text-slate-900 text-base">Knowledge Base & RAG Ingestion</h2>
          <p class="text-xs text-slate-500">Kelola dokumen pengetahuan portal SITA Badung, chunking, & vector embeddings</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <input
            v-model="searchKeyword"
            @input="fetchKnowledge"
            type="text"
            placeholder="Cari artikel knowledge..."
            class="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 w-48 sm:w-60"
          />
          <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        <button
          @click="handleTriggerScraper"
          :disabled="isScraping"
          class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sita-600 to-sita-500 hover:from-sita-700 hover:to-sita-600 text-white transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
        >
          <span v-if="!isScraping">🌐 Scrape sita.badungkab.go.id</span>
          <span v-else class="flex items-center space-x-1.5">
            <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Sedang Crawl...</span>
          </span>
        </button>

        <button
          @click="openAddModal"
          class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gold-600 hover:bg-gold-700 text-white transition shadow-sm flex items-center space-x-1"
        >
          <span>➕</span>
          <span>Tambah Dokumen</span>
        </button>
      </div>
    </div>

    <!-- Knowledge Grid -->
    <div class="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-1">
      <div
        v-for="item in knowledgeList"
        :key="item.id"
        class="glass-panel rounded-2xl p-4 border border-slate-200/90 hover:border-sita-400 transition flex flex-col justify-between space-y-3 shadow-xs bg-white"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" :class="getCategoryBadge(item.category)">
              {{ item.category }}
            </span>
            <div class="flex items-center space-x-2 text-[10px] text-slate-500">
              <span class="font-mono text-sita-700 font-bold">{{ item.chunks_count || 0 }} chunks</span>
              <span>•</span>
              <span class="font-mono text-gold-700 font-bold">{{ item.total_tokens || 0 }} tokens</span>
            </div>
          </div>

          <h3 class="font-bold text-slate-900 text-sm line-clamp-2">{{ item.title }}</h3>
          <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">{{ item.raw_content }}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <a
            v-if="item.source_url"
            :href="item.source_url"
            target="_blank"
            class="text-sita-700 hover:underline text-[11px] truncate max-w-[140px] font-medium"
          >
            Portal SITA ↗
          </a>
          <span v-else class="text-slate-400 text-[11px]">Input Manual</span>

          <div class="flex items-center space-x-1.5">
            <button
              @click="openEditModal(item)"
              class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              title="Edit Dokumen"
            >
              ✏️
            </button>
            <button
              @click="handleDelete(item)"
              class="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 transition"
              title="Hapus"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div class="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 bg-white relative max-h-[90vh] overflow-y-auto">
        <button @click="showModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1">✕</button>

        <h3 class="text-lg font-bold text-slate-900 mb-4">
          {{ editingItem ? 'Edit Knowledge Base' : 'Tambah Knowledge Base Baru' }}
        </h3>

        <form @submit.prevent="handleSave" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 font-semibold mb-1">Judul Dokumen / Topik <span class="text-red-500">*</span></label>
            <input
              v-model="modalForm.title"
              type="text"
              required
              placeholder="Contoh: Tiket Masuk & Jadwal Tari Kecak Uluwatu"
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 font-semibold mb-1">Kategori</label>
              <select
                v-model="modalForm.category"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
              >
                <option value="destinasi">Destinasi Wisata</option>
                <option value="acara">Acara & Budaya</option>
                <option value="akomodasi">Akomodasi & Industri</option>
                <option value="layanan">Layanan & Pengaduan</option>
                <option value="umum">Umum</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 font-semibold mb-1">URL Sumber (Opsional)</label>
              <input
                v-model="modalForm.sourceUrl"
                type="url"
                placeholder="https://sita.badungkab.go.id/..."
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-700 font-semibold mb-1">Konten / Isi Lengkap <span class="text-red-500">*</span></label>
            <textarea
              v-model="modalForm.rawContent"
              required
              rows="6"
              placeholder="Masukkan teks lengkap dokumen. Sistem akan otomatis memecah (chunk) dan membuat vector embedding ke PostgreSQL..."
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sita-500 text-xs leading-relaxed"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition">
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl font-bold text-white bg-sita-600 hover:bg-sita-700 transition shadow-sm"
            >
              {{ isSaving ? 'Menyimpan & Embedding...' : 'Simpan & Embed Vektor' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { KnowledgeAPI } from '../services/api';

const knowledgeList = ref<any[]>([]);
const searchKeyword = ref('');
const isScraping = ref(false);
const showModal = ref(false);
const isSaving = ref(false);
const editingItem = ref<any>(null);

const modalForm = ref({
  title: '',
  category: 'destinasi',
  sourceUrl: '',
  rawContent: '',
});

const fetchKnowledge = async () => {
  try {
    const res = await KnowledgeAPI.list({ search: searchKeyword.value || undefined });
    knowledgeList.value = res.data.knowledge || [];
  } catch (err) {
    console.error('Failed to fetch knowledge:', err);
  }
};

const handleTriggerScraper = async () => {
  if (confirm('Jalankan web scraper untuk crawl portal resmi sita.badungkab.go.id sekarang?')) {
    isScraping.value = true;
    try {
      const res = await KnowledgeAPI.scrape();
      alert(`Scraping berhasil! ${res.data.result.totalArticles} artikel pariwisata telah di-chunk dan di-embed.`);
      await fetchKnowledge();
    } catch (err) {
      alert('Gagal menjalankan scraper.');
    } finally {
      isScraping.value = false;
    }
  }
};

const openAddModal = () => {
  editingItem.value = null;
  modalForm.value = {
    title: '',
    category: 'destinasi',
    sourceUrl: '',
    rawContent: '',
  };
  showModal.value = true;
};

const openEditModal = (item: any) => {
  editingItem.value = item;
  modalForm.value = {
    title: item.title,
    category: item.category,
    sourceUrl: item.source_url || '',
    rawContent: item.raw_content,
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (!modalForm.value.title || !modalForm.value.rawContent) return;
  isSaving.value = true;
  try {
    if (editingItem.value) {
      await KnowledgeAPI.update(editingItem.value.id, modalForm.value);
    } else {
      await KnowledgeAPI.create(modalForm.value);
    }
    showModal.value = false;
    await fetchKnowledge();
  } catch (err: any) {
    alert(err?.response?.data?.error || 'Gagal menyimpan knowledge base.');
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (item: any) => {
  if (confirm(`Hapus dokumen "${item.title}" beserta vektor chunk-nya?`)) {
    try {
      await KnowledgeAPI.delete(item.id);
      await fetchKnowledge();
    } catch (err) {
      alert('Gagal menghapus.');
    }
  }
};

onMounted(() => {
  fetchKnowledge();
});

const getCategoryBadge = (cat: string) => {
  switch (cat) {
    case 'destinasi':
      return 'bg-sita-100 text-sita-800 border border-sita-200';
    case 'acara':
      return 'bg-gold-100 text-gold-800 border border-gold-300';
    case 'akomodasi':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'layanan':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};
</script>
