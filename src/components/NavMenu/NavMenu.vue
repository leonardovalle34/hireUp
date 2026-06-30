<script lang="ts">
  export default { name: 'NavMenu' };
</script>

<script setup lang="ts">
  import { useRouter, useRoute } from 'vue-router';
  import {
    HomeOutlined,
    AudioOutlined,
    BookOutlined,
    ProfileOutlined,
    BulbOutlined,
    ReadOutlined,
    DollarOutlined,
  } from '@ant-design/icons-vue';

  const router = useRouter();
  const route = useRoute();
</script>

<template>
  <div>
    <a-menu
      class="nav-menu"
      theme="dark"
      mode="horizontal"
      :selectedKeys="[route.path]"
    >
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
      <a-menu-item key="/lessons" @click="router.push('/lessons')">
        <ProfileOutlined />
        <span class="nav-label">Aulas</span>
      </a-menu-item>
      <a-menu-item key="/quiz" @click="router.push('/quiz')">
        <BulbOutlined />
        <span class="nav-label">Quiz</span>
      </a-menu-item>
      <a-menu-item key="/news" @click="router.push('/news')">
        <ReadOutlined />
        <span class="nav-label">Notícias</span>
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

  .nav-menu :deep(.ant-menu-item) {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px 0 !important;
    margin: 0 !important;
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
