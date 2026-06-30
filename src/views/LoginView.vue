<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { signInWithGoogle } from '@/services/auth';

  const email = ref('');
  const password = ref('');
  const auth = useAuthStore();
  const router = useRouter();
  const { loading, error } = storeToRefs(auth);

  async function handleLogin() {
    await auth.login(email.value, password.value);
    if (auth.user) router.push('/');
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      error.value = err.message;
    }
  };

  async function handleSignup() {
    router.push('/signup');
  }

  let deferredPrompt: any = null;
  const canInstall = ref(false);

  function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        canInstall.value = false;
      });
    }
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      canInstall.value = true;
    });
  });
</script>

<template>
  <div class="login-wrapper">
    <div class="brand">
      <img src="/noTitleHireUpLogo.png" alt="Logo" width="150px" />
      <h1>HireUp</h1>
      <p>Daily English Challenge</p>
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
          Criar uma conta
        </a-button>
        <a-divider>ou</a-divider>

        <a-button size="large" block @click="handleGoogleLogin">
          <template #icon>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              style="width: 18px; margin-right: 20px"
            />
          </template>
          Continue com Google
        </a-button>

        <button v-if="canInstall" class="btn-install" @click="installApp">
          📲 Instalar o App
        </button>

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

  .btn-install {
    display: block;
    width: 100%;
    margin-top: 12px;
    padding: 10px 16px;
    background: transparent;
    border: 1.5px solid #d9d9d9;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition:
      border-color 0.2s,
      color 0.2s;
  }

  .btn-install:hover {
    border-color: #1677ff;
    color: #1677ff;
  }
</style>
