<script lang="ts">
export default { name: 'NavMenu' };
</script>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import {
  HomeOutlined,
  AudioOutlined,
  BookOutlined,
  DollarOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
</script>

<template>
  <div>
    <a-menu class="nav-menu" theme="dark" mode="horizontal" :selectedKeys="[route.path]">
      <a-menu-item key="/" @click="router.push('/')">
        <HomeOutlined />
        <span class="nav-label">Início</span>
      </a-menu-item>
      <a-menu-item key="/interview" @click="router.push('/interview')">
        <AudioOutlined />
        <span class="nav-label">Treino</span>
      </a-menu-item>
      <a-menu-item key="/tutor" @click="router.push('/tutor')">
        <BookOutlined />
        <span class="nav-label">Tutor</span>
      </a-menu-item>
      <a-menu-item key="/pricing" @click="router.push('/pricing')">
        <DollarOutlined />
        <span class="nav-label">Planos</span>
      </a-menu-item>
    </a-menu>
  </div>
</template>

<style scoped>
.nav-menu {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-around !important;
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 1000 !important;
}

/* Mobile: esconde o texto */
.nav-label {
  display: none;
}

/* Desktop: mostra o texto */
@media (min-width: 768px) {
  .nav-label {
    display: inline;
    margin-left: 6px;
  }
}
</style>
