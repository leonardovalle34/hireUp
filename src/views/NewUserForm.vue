<script lang="ts">
  export default {
    name: 'NewUserForm',
  };
</script>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import router from '@/router';

  const auth = useAuthStore();

  const name = ref('');
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const error = ref('');

  const handleRegister = async () => {
    error.value = '';

    if (!name.value.trim()) {
      error.value = 'Nome é obrigatório';
      return;
    }

    if (!email.value.trim()) {
      error.value = 'Email é obrigatório';
      return;
    }

    if (!password.value.trim()) {
      error.value = 'Senha é obrigatória';
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = 'As senhas não coincidem';
      return;
    }

    await auth.register(email.value, password.value, name.value);
    if (auth.error) {
      error.value = auth.error;
      return;
    } else {
      router.push('/');
    }
  };
</script>

<template>
  <div class="container">
    <a-card class="card">
      <h2 class="title">Criar conta</h2>

      <a-form layout="vertical">
        <a-form-item label="Nome">
          <a-input v-model:value="name" placeholder="Seu nome" size="large" />
        </a-form-item>

        <a-form-item label="Email">
          <a-input
            v-model:value="email"
            placeholder="seu@email.com"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Senha">
          <a-input-password
            v-model:value="password"
            placeholder="••••••••"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Confirmar Senha">
          <a-input-password
            v-model:value="confirmPassword"
            placeholder="••••••••"
            size="large"
          />
        </a-form-item>

        <a-button
          type="primary"
          block
          size="large"
          :loading="auth.loading"
          @click="handleRegister"
        >
          Criar conta
        </a-button>

        <a-alert
          v-if="error || auth.error"
          :message="error || auth.error"
          type="error"
          show-icon
          class="mt"
        />
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #f5f5f5;
  }

  .card {
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
  }

  .title {
    text-align: center;
    margin-bottom: 24px;
  }

  .mt {
    margin-top: 16px;
  }
</style>
