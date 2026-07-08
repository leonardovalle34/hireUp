<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import NavMenu from '@/components/NavMenu/NavMenu.vue';
  import Header from '@/components/Header/Header.vue';
  import InstallPwaModal from '@/components/InstallPwaModal/InstallPwaModal.vue';
  import DictionaryModal from '@/components/DictionaryModal/DictionaryModal.vue';

  const showDictionary = ref(false);
  const dictionaryWord = ref('');

  function openDictionary(word = '') {
    dictionaryWord.value = word;
    showDictionary.value = true;
  }

  function closeDictionary() {
    showDictionary.value = false;
    dictionaryWord.value = '';
  }

  function handleTextSelection(event: Event) {
    const selection = window.getSelection?.();
    const text = selection?.toString().trim() ?? '';
    if (text && text.length <= 300) {
      selection?.removeAllRanges();
      if (event.cancelable) {
        event.preventDefault();
      }
      openDictionary(text);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showDictionary.value) {
      closeDictionary();
    }
  }

  onMounted(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection, { passive: false });
    document.addEventListener('keydown', handleKeydown);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('touchend', handleTextSelection);
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<template>
  <a-layout class="app-layout">
    <Header />
    <a-layout>
      <a-layout-content class="app-content">
        <router-view />
        <NavMenu />
      </a-layout-content>
    </a-layout>
    <InstallPwaModal />

    <button class="dictionary-fab" title="Dicionário" @click="openDictionary()">📖</button>
    <DictionaryModal v-if="showDictionary" :initial-word="dictionaryWord" @close="closeDictionary" />
  </a-layout>
</template>

<style scoped>
  .app-layout {
    min-height: 100vh;
    background: transparent !important;
    width: 100%;
  }

  .app-content {
    padding: 64px 16px 80px 16px !important;
    background: transparent !important;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .dictionary-fab {
    position: fixed;
    right: 16px;
    bottom: 88px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: white;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--card-shadow);
    cursor: pointer;
    z-index: 2000;
  }
</style>
