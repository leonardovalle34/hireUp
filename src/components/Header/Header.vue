<script lang="ts">
  export default {
    name: 'Header',
  };
</script>
<script setup lang="ts">
  import { ref } from 'vue';
  let deferredPrompt: any = null;
  const canInstall = ref(false);

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
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
    <a-button v-if="canInstall" type="primary" @click="installApp">
      📲 Instalar App
    </a-button>
  </a-layout-header>
</template>
<style scoped>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    font-size: 24px;
    font-weight: 700;
    color: white;
  }
</style>
