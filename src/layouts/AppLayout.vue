<script setup lang="ts">
  import NavMenu from '@/components/NavMenu/NavMenu.vue';
  import Header from '@/components/Header/Header.vue';
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
  </a-layout>
</template>

<style scoped>
  .app-layout {
    min-height: 100vh;
    background: transparent !important;
  }
  .app-content {
    padding: 20px;
    background: transparent !important;
  }
</style>
