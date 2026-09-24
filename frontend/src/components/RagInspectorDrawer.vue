<template>
  <div v-if="isOpen" class="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-slate-200 shadow-2xl p-5 flex flex-col animate-slide-left overflow-y-auto bg-white/95">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
      <div class="flex items-center space-x-2">
        <span class="text-lg">🔬</span>
        <h3 class="font-bold text-slate-900 text-sm">RAG & Token Debugger</h3>
      </div>
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg">✕</button>
    </div>

    <div v-if="!debug" class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs py-10">
      <span class="text-3xl mb-2">⚡</span>
      Kirim sebuah pesan di chat untuk melihat data inspeksi RAG & Fireworks AI secara real-time.
    </div>

    <div v-else class="space-y-4 text-xs">
      <!-- Token Metric Cards -->
      <div class="grid grid-cols-2 gap-2">
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Tokens</span>
          <span class="text-xl font-mono font-extrabold text-sita-700">{{ debug.totalTokens }}</span>
          <span class="text-[10px] text-slate-400 block">tokens</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-[10px] uppercase font-bold text-slate-500 block">Latency AI</span>
          <span class="text-xl font-mono font-extrabold text-gold-700">{{ debug.latencyMs }}</span>
          <span class="text-[10px] text-slate-400 block">ms</span>
        </div>
      </div>

      <!-- Token Breakdown -->
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">Prompt Tokens (RAG + Sys):</span>
          <span class="font-mono text-slate-800 font-bold">{{ debug.promptTokens }}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">Completion Tokens:</span>
          <span class="font-mono text-slate-800 font-bold">{{ debug.completionTokens }}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-500">AI Model:</span>
          <span class="font-mono text-sita-700 truncate max-w-[170px] font-bold">{{ debug.modelName }}</span>
        </div>
      </div>

      <!-- Retrieved RAG Chunks -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Retrieved Chunks (Top-K):</span>
          <span class="px-2 py-0.5 rounded-full bg-sita-100 text-sita-800 text-[10px] font-bold border border-sita-200">
            {{ debug.retrievedChunks?.length || 0 }} chunks
          </span>
        </div>

        <div v-if="!debug.retrievedChunks || debug.retrievedChunks.length === 0" class="p-3 rounded-xl bg-slate-50 text-slate-400 text-center text-xs border border-slate-200">
          Tidak ada chunk yang memenuhi ambang batas relevansi.
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(chunk, idx) in debug.retrievedChunks"
            :key="idx"
            class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs truncate max-w-[180px]">{{ chunk.title }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Score: {{ (chunk.score * 100).toFixed(1) }}%
              </span>
            </div>
            <p class="text-[11px] text-slate-700 line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
              {{ chunk.chunkText }}
            </p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span class="capitalize">Kategori: {{ chunk.category }}</span>
              <a v-if="chunk.sourceUrl" :href="chunk.sourceUrl" target="_blank" class="text-sita-700 hover:underline font-medium">Link Sumber ↗</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  debug: any;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>
