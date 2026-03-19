<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useAuthStore } from './stores/auth';

  const auth = useAuthStore();

  onMounted(() => {
    auth.loadUser();
    auth.listenAuth();
  });
</script>
<template>
  <div class="app-background">
    <router-view />
  </div>
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Manrope';
    font-weight: 700;
  }
  .app-background {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(135deg, #034fb9 0%, #2e2992 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
