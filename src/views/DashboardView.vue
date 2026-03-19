<script lang="ts">
  export default {
    name: 'DashboardView',
  };
</script>

<script setup lang="ts">
  import { useUserPlan } from '@/composables/useUserPlan';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import AlertComponent from '@/components/AlertComponent/AlertComponent.vue';
  import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

  const auth = useAuthStore();
  const { user, profile } = storeToRefs(auth);
  const { isFree } = useUserPlan();
</script>

<template>
  <AlertComponent
    v-if="isFree"
    :message="'Você está no plano Free. Faça upgrade para liberar todas as lições.'"
    type="info"
    :show-icon="true"
  >
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
  </AlertComponent>
  <div class="container">
    <div class="header">
      <h1>👋 Olá, {{ profile?.name || user?.email }}</h1>
      <p class="email">{{ user?.email }}</p>
    </div>

    <div class="cards">
      <div class="card">
        <p class="label">Plano</p>
        <h2>{{ isFree ? 'Free' : 'Pro' }}</h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .container {
    padding: 16px;
    max-width: 500px;
    margin: 40px 0px 0px 0px;
  }

  .header {
    margin-bottom: 20px;
  }

  .header h1 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .email {
    font-size: 14px;
    color: #888;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 12px;
  }

  .card .label {
    font-size: 12px;
    color: #666;
  }

  .card h2 {
    margin-top: 4px;
  }

  /* DESKTOP */
  @media (min-width: 768px) {
    .cards {
      flex-direction: row;
    }

    .card {
      flex: 1;
    }
  }
</style>
