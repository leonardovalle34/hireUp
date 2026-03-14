<script lang="ts">
export default {
  name: 'DashboardView',
}
</script>
<script setup lang="ts">
import { useUserPlan } from '@/composables/useUserPlan'
import { useAuthStore } from '@/stores/auth'

const { isFree } = useUserPlan()
const auth = useAuthStore()
</script>

<template>
  <div class="container">
    <a-alert
      v-if="isFree"
      message="Você está no plano Free. Faça upgrade para liberar todas as lições."
      type="info"
    />
    <h1>Dashboard</h1>
    <p>Welcome {{ auth.user?.email }}</p>

    <button @click="auth.logout()">Logout</button>
  </div>
</template>
