<script setup lang="ts">
  import { ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';

  const email = ref('');
  const password = ref('');
  const auth = useAuthStore();
  const router = useRouter();
  const { loading, error } = storeToRefs(auth);

  async function handleLogin() {
    await auth.login(email.value, password.value);
    if (auth.user) router.push('/');
  }

  /*async function handleSignup() {
  await auth.signUp(email.value, password.value)
  if (auth.user) router.push('/')
}*/
</script>

<template>
  <div class="login-wrapper">
    <div class="brand">
      <img src="/noTitleHireUpLogo.png" alt="Logo" width="150px" />
      <h1>HireUp</h1>
      <p>Daily English Challenge for developers</p>
    </div>

    <a-card class="login-card" bordered>
      <template #title>
        <div style="text-align: center">
          <h2 style="margin: 0">Login</h2>
        </div>
      </template>

      <a-form layout="vertical">
        <a-form-item label="Email">
          <a-input v-model:value="email" />
        </a-form-item>

        <a-form-item label="Password">
          <a-input-password v-model:value="password" />
        </a-form-item>

        <a-button type="primary" block :loading="loading" @click="handleLogin">
          Login
        </a-button>

        <a-divider>or</a-divider>
        <a-button block :loading="loading" @click="handleSignup">
          Create Account
        </a-button>

        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          style="margin-top: 15px"
        />
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
  .login-wrapper {
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .brand {
    color: white;
    margin-bottom: 30px;
  }

  .brand h1 {
    font-size: 36px;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .brand p {
    opacity: 0.9;
  }

  .login-card {
    border-radius: 12px;
  }
</style>
