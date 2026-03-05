<script lang="ts">
export default {
  name: 'DashboardView',
}
</script>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="container">
    <h1>Dashboard</h1>
    <p>Welcome {{ auth.user?.email }}</p>

    <button @click="auth.logout()">Logout</button>
  </div>
</template>
