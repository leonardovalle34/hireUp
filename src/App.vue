<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useAuthStore } from './stores/auth';

  //const auth = useAuthStore();

  onMounted(async () => {
    //await auth.fetchUser();
    //auth.listenAuth();
  });
</script>
<template>
  <div
    style="
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    "
  >
    <h1 style="font-size: 64px">Under Construction</h1>
    <p style="font-size: 64px">Coming soon...</p>
  </div>

  <!--<div class="app-background">
    <router-view />
  </div>-->
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
    background: linear-gradient(135deg, #001633 0%, #060042 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
