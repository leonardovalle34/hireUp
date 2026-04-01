<script lang="ts">
  export default {
    name: 'NavMenu',
  };
</script>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import {
    HomeOutlined,
    AudioOutlined,
    DollarOutlined,
    LogoutOutlined,
    InfoCircleOutlined,
    CustomerServiceOutlined,
  } from '@ant-design/icons-vue';
  import { useScreen } from '@/hooks/useScreen';
  import { useAuthStore } from '@/stores/auth';

  const router = useRouter();
  const auth = useAuthStore();
  const { isMobile } = useScreen();

  function logout() {
    auth.logout();
  }
</script>

<template>
  <div>
    <a-menu class="nav-menu" theme="dark" mode="inline">
      <a-menu-item key="dashboard" @click="router.push('/')">
        <HomeOutlined />
        <span v-if="!isMobile">Dashboard</span>
      </a-menu-item>

      <a-menu-item key="lesson" @click="router.push('/lessons')">
        <AudioOutlined />
        <span v-if="!isMobile">Treino</span>
      </a-menu-item>

      <a-menu-item key="pricing" @click="router.push('/pricing')">
        <DollarOutlined />
        <span v-if="!isMobile">Assinatura</span>
      </a-menu-item>

      <a-menu-divider />

      <a-menu-item key="about" @click="router.push('/about')">
        <InfoCircleOutlined />
        <span v-if="!isMobile">Quem Somos</span>
      </a-menu-item>

      <a-menu-item key="support" @click="router.push('/support')">
        <CustomerServiceOutlined />
        <span v-if="!isMobile">Suporte</span>
      </a-menu-item>

      <a-menu-divider />

      <a-menu-item key="logout" @click="logout">
        <LogoutOutlined />
        <span v-if="!isMobile">Logout</span>
      </a-menu-item>
    </a-menu>
  </div>
</template>
<style scoped>
  .nav-menu {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
  }
</style>
