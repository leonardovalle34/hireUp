<script setup lang="ts">
  import NavMenu from '@/components/NavMenu/NavMenu.vue';
  import Header from '@/components/Header/Header.vue';
  import InstallPwaModal from '@/components/InstallPwaModal/InstallPwaModal.vue';
</script>

<template>
  <a-layout class="app-layout">
    <Header />
    <a-layout>
      <a-layout-content class="app-content">
        <router-view />
        <NavMenu />
      </a-layout-content>
    </a-layout>
    <InstallPwaModal />
  </a-layout>
</template>

<style scoped>
  .app-layout {
    min-height: 100vh;
    background: transparent !important;
    width: 100%;
  }

  .app-content {
    padding: 64px 16px 80px 16px !important;
    background: transparent !important;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
</style>
