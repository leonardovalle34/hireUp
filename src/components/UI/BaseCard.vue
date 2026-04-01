<script setup lang="ts">
  defineProps<{
    title?: string;
    subtitle?: string;
    center?: boolean;
  }>();
</script>

<template>
  <div class="card" :class="{ center }">
    <div v-if="title" class="header">
      <h2>{{ title }}</h2>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .card {
    background: #fafafa;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
  }

  .card:hover {
    background: #ffffff;
    border-color: #d9d9d9;
    transform: translateY(-2px);
  }

  /* Header */
  .header {
    margin-bottom: 12px;
  }

  .header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #262626;
  }

  .subtitle {
    font-size: 13px;
    color: #8c8c8c;
    margin-top: 4px;
  }

  /* Content */
  .content {
    font-size: 14px;
    color: #4a5568;
    line-height: 1.5;
  }

  /* Optional center mode */
  .center {
    text-align: center;
  }
</style>
