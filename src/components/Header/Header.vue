<script lang="ts">
  export default {
    name: 'Header',
  };
</script>
<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';

  const auth = useAuthStore();
  const router = useRouter();
  const { dashboardUser } = storeToRefs(auth);
  const menuOpen = ref(false);

  const avatarLetter = computed(() => {
    const name = dashboardUser.value?.name || dashboardUser.value?.email || 'U';
    return name.charAt(0).toUpperCase();
  });

  function toggleMenu() { menuOpen.value = !menuOpen.value; }
  function closeMenu() { menuOpen.value = false; }
  function logout() { auth.logout(); closeMenu(); }

  let deferredPrompt: any = null;
  const canInstall = ref(false);

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        canInstall.value = false;
      });
    }
  };

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    canInstall.value = true;
  });
</script>
<template>
  <a-layout-header class="header">
    <div class="logo">
      <img src="/noTitleHireUpLogo.png" alt="Logo" width="50px" />
      <h1 class="title">Hire Up</h1>
    </div>
    <div class="avatar-wrap">
      <button class="avatar-btn" @click="toggleMenu">{{ avatarLetter }}</button>
      <div v-if="menuOpen" class="avatar-menu">
        <button @click="router.push('/settings'); closeMenu()">⚙️ Configurações</button>
        <button @click="router.push('/support'); closeMenu()">💬 Suporte</button>
        <button @click="logout">🚪 Sair</button>
      </div>
      <div v-if="menuOpen" class="overlay" @click="closeMenu"></div>
    </div>
  </a-layout-header>
</template>
<style scoped>
  .header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    z-index: 1000 !important;
    background: #001633 !important;
    padding: 0 16px !important;
    height: 56px !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  .avatar-wrap { position: relative; }
  .avatar-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    border: none;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .avatar-menu {
    position: absolute;
    top: 44px;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    overflow: hidden;
    min-width: 180px;
    z-index: 2000;
  }
  .avatar-menu button {
    display: block;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    text-align: left;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    color: #111;
  }
  .avatar-menu button:hover { background: #f3f4f6; }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1999;
  }
</style>
