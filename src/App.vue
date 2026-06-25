<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useAuthStore } from './stores/auth';
  import './assets/global.css';

  const auth = useAuthStore();

  onMounted(async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    auth.listenAuth();
  });
</script>

<template>
  <div class="app-background">
    <router-view />
  </div>
</template>
<style>
  .app-background {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: var(--bg-app);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
  }
</style>
