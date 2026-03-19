<script lang="ts">
  export default {
    name: 'Loading',
  };
</script>
<template>
  <div class="overlay">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(255, 255, 255, 0.7);

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 9999;
  }

  /* Spinner */
  .spinner {
    width: 48px;
    height: 48px;
    border: 5px solid #e6f0ff;
    border-top: 5px solid #1677ff;
    border-radius: 50%;

    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
