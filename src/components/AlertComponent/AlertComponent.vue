<script lang="ts">
  export default {
    name: 'AlertComponent',
  };
</script>
<script lang="ts" setup>
  const props = defineProps<{
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    showIcon?: boolean;
  }>();
</script>

<template>
  <a-alert :message="message" :type="type" :show-icon="showIcon" class="alert">
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </a-alert>
</template>

<style scoped>
  .alert {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: 90%;
    max-width: 400px;

    text-align: center;
  }

  :deep(.ant-alert-content) {
    text-align: center;
    width: 100%;
  }

  :deep(.ant-alert) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
