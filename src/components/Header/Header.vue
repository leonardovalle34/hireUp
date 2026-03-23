<script lang="ts">
  export default {
    name: 'Header',
  };
</script>
<template>
  <a-layout-header class="header">
    <div class="logo">
      <img src="/noTitleHireUpLogo.png" alt="Logo" width="50px" />
      <h1 class="title">Hire Up</h1>
    </div>
  </a-layout-header>
</template>
<style scoped>
  .header {
    display: flex;
    align-items: center;
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
