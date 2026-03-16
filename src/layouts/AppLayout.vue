<script setup lang="ts">
  import NavMenu from '@/components/NavMenu/NavMenu.vue';
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout>
      <a-layout-content style="padding: 40px">
        <router-view />
        <NavMenu />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
