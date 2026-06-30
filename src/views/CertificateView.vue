<script lang="ts">
export default { name: 'CertificateView' };
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { downloadCertificate, generateCertificate } from '@/utils/certificate';

const router = useRouter();
const auth = useAuthStore();
const { dashboardUser } = storeToRefs(auth);
const previewUrl = ref<string | null>(null);

function handleDownload() {
  const name = dashboardUser.value?.name || 'Aluno HireUp';
  downloadCertificate(name);
}

onMounted(() => {
  const name = dashboardUser.value?.name || 'Aluno HireUp';
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const doc = generateCertificate(name, date);
  previewUrl.value = doc.output('datauristring');
});
</script>

<template>
  <div class="cert-container">
    <div class="cert-card">
      <h1>🎓 Seu Certificado</h1>
      <p class="subtitle">Parabéns por completar as 40 aulas do HireUp!</p>

      <div class="preview-wrap">
        <iframe v-if="previewUrl" :src="previewUrl" class="preview-frame"></iframe>
      </div>

      <button class="btn-blue" @click="handleDownload">📥 Baixar Certificado PDF</button>
      <button class="btn-ghost" @click="router.push('/badges')">Voltar às Conquistas</button>
    </div>
  </div>
</template>

<style scoped>
.cert-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex;
  justify-content: center;
}
.cert-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: var(--card-shadow);
}
h1 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; }
.subtitle { font-size: 14px; color: var(--text-secondary); text-align: center; margin: 0; }
.preview-wrap {
  width: 100%;
  aspect-ratio: 1.41;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.preview-frame { width: 100%; height: 100%; border: none; }
.btn-blue {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn-ghost {
  width: 100%;
  padding: 11px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
}
</style>
