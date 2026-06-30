<script lang="ts">
  export default { name: 'NavMenu' };
</script>

<script setup lang="ts">
  import {
    HomeOutlined,
    AudioOutlined,
    BookOutlined,
    ProfileOutlined,
    BulbOutlined,
    ReadOutlined,
    DollarOutlined,
  } from '@ant-design/icons-vue';

  const items = [
    { path: '/', label: 'Início', icon: HomeOutlined },
    { path: '/interview', label: 'Treino', icon: AudioOutlined },
    { path: '/tutor', label: 'Tutor', icon: BookOutlined },
    { path: '/lessons', label: 'Aulas', icon: ProfileOutlined },
    { path: '/quiz', label: 'Quiz', icon: BulbOutlined },
    { path: '/news', label: 'Notícias', icon: ReadOutlined },
    { path: '/pricing', label: 'Planos', icon: DollarOutlined },
  ];
</script>

<template>
  <nav class="nav-menu">
    <router-link
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ 'nav-item--active': $route.path === item.path }"
    >
      <component :is="item.icon" class="nav-icon" />
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
  .nav-menu {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    padding: 4px 4px;
    background: #001529; /* mesma cor do theme="dark" do antd, ajuste se precisar */
  }

  .nav-item {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px 2px;
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
  }

  .nav-item--active {
    color: #fff;
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-label {
    display: none;
  }

  @media (min-width: 768px) {
    .nav-label {
      display: inline;
      font-size: 10px;
      margin-top: 2px;
    }
  }
</style>
