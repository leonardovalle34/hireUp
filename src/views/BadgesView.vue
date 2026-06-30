<script lang="ts">
export default { name: 'BadgesView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getUserBadges } from '@/services/lessons';

const router = useRouter();
const auth = useAuthStore();
const earnedBadges = ref<{ badge_type: string; earned_at: string }[]>([]);
const loading = ref(true);

const allBadges = [
  { type: 'beginner_graduate', emoji: '🌱', title: 'Beginner Graduate', desc: 'Completou todas as 8 aulas Beginner' },
  { type: 'elementary_graduate', emoji: '📚', title: 'Elementary Graduate', desc: 'Completou todas as 8 aulas Elementary' },
  { type: 'intermediate_graduate', emoji: '🎯', title: 'Intermediate Graduate', desc: 'Completou todas as 10 aulas Intermediate' },
  { type: 'advanced_graduate', emoji: '🏆', title: 'Advanced Graduate', desc: 'Completou todas as 8 aulas Advanced' },
  { type: 'business_graduate', emoji: '💼', title: 'Business Graduate', desc: 'Completou todas as 6 aulas Business English' },
  { type: 'hireup_master', emoji: '🎓', title: 'HireUp Master', desc: 'Completou as 40 aulas — curso inteiro!' },
];

function isEarned(type: string) {
  return earnedBadges.value.some(b => b.badge_type === type);
}

function earnedDate(type: string) {
  const badge = earnedBadges.value.find(b => b.badge_type === type);
  return badge ? new Date(badge.earned_at).toLocaleDateString('pt-BR') : null;
}

const hasMasterBadge = computed(() => isEarned('hireup_master'));

onMounted(async () => {
  if (auth.user?.id) {
    earnedBadges.value = await getUserBadges(auth.user.id);
  }
  loading.value = false;
});
</script>

<template>
  <div class="badges-container">
    <div class="badges-header">
      <h1>🏆 Minhas Conquistas</h1>
      <p class="subtitle">{{ earnedBadges.length }}/6 conquistas desbloqueadas</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="badges-grid">
      <div
        v-for="badge in allBadges"
        :key="badge.type"
        class="badge-card"
        :class="{ earned: isEarned(badge.type), master: badge.type === 'hireup_master' && isEarned(badge.type) }"
      >
        <div class="badge-emoji">{{ isEarned(badge.type) ? badge.emoji : '🔒' }}</div>
        <h3 class="badge-title">{{ badge.title }}</h3>
        <p class="badge-desc">{{ badge.desc }}</p>
        <p v-if="isEarned(badge.type)" class="badge-date">Conquistado em {{ earnedDate(badge.type) }}</p>
      </div>
    </div>

    <button v-if="hasMasterBadge" class="btn-certificate" @click="router.push('/certificate')">
      📜 Ver meu Certificado
    </button>

    <button class="btn-ghost" @click="router.push('/')">Voltar ao Dashboard</button>
  </div>
</template>

<style scoped>
.badges-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.badges-header { text-align: center; }
.badges-header h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.subtitle { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.loading { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.badges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (min-width: 600px) {
  .badges-grid { grid-template-columns: repeat(3, 1fr); }
}
.badge-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px 14px;
  text-align: center;
  border: 2px solid var(--border);
  box-shadow: var(--card-shadow);
  opacity: 0.5;
  transition: all 0.2s;
}
.badge-card.earned {
  opacity: 1;
  border-color: var(--accent);
}
.badge-card.master {
  border-color: #f59e0b;
  background: linear-gradient(135deg, var(--card-bg), #fffbeb);
}
.badge-emoji { font-size: 40px; margin-bottom: 8px; }
.badge-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.badge-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin: 0; }
.badge-date { font-size: 10px; color: var(--accent); font-weight: 600; margin-top: 8px; }
.btn-certificate {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
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
