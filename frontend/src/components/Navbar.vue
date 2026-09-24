<template>
  <header class="glass-panel border-b border-slate-200/80 sticky top-0 z-40 bg-white/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand / Logo -->
      <router-link to="/playground" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sita-600 to-sita-500 flex items-center justify-center shadow-md shadow-sita-600/20 border border-sita-400/30 group-hover:scale-105 transition-transform text-white">
          <span class="text-xl">🌺</span>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sita-800 via-sita-700 to-slate-900 bg-clip-text text-transparent">
              SITA BADUNG
            </span>
            <span
              v-if="isAdminRoute"
              class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-300"
            >
              Portal Petugas / Admin
            </span>
            <span
              v-else
              class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-sita-100 text-sita-800 border border-sita-200"
            >
              Helpdesk & Asisten Resmi
            </span>
          </div>
          <p class="text-xs text-slate-500 hidden sm:block">Sistem Informasi Pariwisata Kabupaten Badung, Bali</p>
        </div>
      </router-link>

      <!-- ADMIN ONLY NAVIGATION TABS (Only visible when user is in /admin/*) -->
      <nav v-if="isAdminRoute" class="flex items-center space-x-1 sm:space-x-2">
        <router-link
          to="/admin/live-chat"
          class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 relative"
          :class="$route.path.startsWith('/admin/live-chat') ? 'bg-sita-600 text-white shadow-md shadow-sita-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
        >
          <span>👨‍💼</span>
          <span class="hidden md:inline">Live Agent</span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </router-link>

        <router-link
          to="/admin/tickets"
          class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5"
          :class="$route.path.startsWith('/admin/tickets') ? 'bg-sita-600 text-white shadow-md shadow-sita-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
        >
          <span>🎫</span>
          <span class="hidden md:inline">Pipeline Tiket</span>
        </router-link>

        <router-link
          to="/admin/knowledge"
          class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5"
          :class="$route.path.startsWith('/admin/knowledge') ? 'bg-sita-600 text-white shadow-md shadow-sita-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
        >
          <span>📚</span>
          <span class="hidden lg:inline">Knowledge RAG</span>
        </router-link>

        <router-link
          to="/admin/analytics"
          class="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5"
          :class="$route.path.startsWith('/admin/analytics') ? 'bg-sita-600 text-white shadow-md shadow-sita-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
        >
          <span>📊</span>
          <span class="hidden lg:inline">Analitik & Token</span>
        </router-link>

        <router-link
          to="/playground"
          class="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition flex items-center space-x-1"
          title="Buka Sisi Customer / Playground"
        >
          <span>💬</span>
          <span class="hidden sm:inline">Lihat Webchat</span>
        </router-link>
      </nav>

      <!-- CUSTOMER PLAYGROUND NAVIGATION (Clean, focused on customer chat) -->
      <div v-else class="flex items-center space-x-2">
        <span class="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center space-x-1.5 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online 24/7</span>
        </span>

        <!-- Discreet staff access button -->
        <router-link
          to="/admin/live-chat"
          class="p-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition text-xs border border-slate-200 flex items-center space-x-1"
          title="Login / Masuk Portal Petugas"
        >
          <span>🔐</span>
          <span class="text-[11px] font-semibold hidden md:inline">Petugas</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const $route = useRoute();
const isAdminRoute = computed(() => $route.path.startsWith('/admin'));
</script>
