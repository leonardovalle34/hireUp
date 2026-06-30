<script lang="ts">
export default { name: 'InstallPwaModal' };
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const aceWaving = new URL('../../assets/ace/ace-waving.png', import.meta.url).href;

const showModal = ref(false);
const platform = ref<'ios' | 'android' | 'other'>('other');

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function closeModal() {
  showModal.value = false;
}

onMounted(() => {
  if (!isStandalone()) {
    platform.value = detectPlatform();
    showModal.value = true;
  }
});
</script>

<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <button class="close-btn" @click="closeModal">✕</button>

      <img :src="aceWaving" alt="Ace" class="ace" />

      <h2>📲 Instale o HireUp no seu celular!</h2>
      <p class="subtitle">Acesso rápido, tela cheia, como um app de verdade.</p>

      <div v-if="platform === 'android'" class="steps">
        <p class="steps-title">No Android:</p>
        <div class="step"><span class="step-num">1</span><span>Toque nos <strong>3 pontinhos</strong> no canto superior direito do Chrome</span></div>
        <div class="step"><span class="step-num">2</span><span>Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></span></div>
        <div class="step"><span class="step-num">3</span><span>Pronto! O ícone do HireUp aparece na sua tela inicial</span></div>
      </div>

      <div v-else-if="platform === 'ios'" class="steps">
        <p class="steps-title">No iPhone:</p>
        <div class="step"><span class="step-num">1</span><span>Toque no ícone de <strong>compartilhar</strong> (quadrado com seta) na barra do Safari</span></div>
        <div class="step"><span class="step-num">2</span><span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span></div>
        <div class="step"><span class="step-num">3</span><span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span></div>
      </div>

      <div v-else class="steps">
        <p class="steps-title">No seu navegador:</p>
        <div class="step"><span class="step-num">1</span><span>Procure o ícone de <strong>instalação</strong> na barra de endereço</span></div>
        <div class="step"><span class="step-num">2</span><span>Ou acesse o menu do navegador e escolha <strong>"Instalar HireUp"</strong></span></div>
      </div>

      <button class="btn-close" @click="closeModal">Entendi, continuar no navegador</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 16px;
}
.modal-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px 22px;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: var(--card-shadow);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
}
.ace { width: 70px; height: auto; }
h2 { font-size: 18px; font-weight: 700; color: var(--text-primary); text-align: center; margin: 0; }
.subtitle { font-size: 13px; color: var(--text-secondary); text-align: center; margin: 0; }
.steps { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.steps-title { font-size: 13px; font-weight: 700; color: var(--accent); margin: 0; }
.step { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--text-primary); line-height: 1.5; }
.step-num {
  background: var(--accent);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.btn-close {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
</style>
