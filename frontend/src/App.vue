<template>
  <div class="min-h-screen flex flex-col selection:bg-sita-500 selection:text-white">
    <Navbar />
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
</script>
