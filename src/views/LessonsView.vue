<script lang="ts">
export default { name: 'LessonsView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useLessonsStore } from '@/stores/lessons';
import { storeToRefs } from 'pinia';

const router = useRouter();
const auth = useAuthStore();
const lessonsStore = useLessonsStore();
const { lessons, loading, progress } = storeToRefs(lessonsStore);

const selectedLevel = ref('all');
const levels = [
  { key: 'all', label: 'Todas' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'elementary', label: 'Elementary' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'business', label: 'Business' },
];

const levelColors: Record<string, { bg: string; color: string }> = {
  beginner: { bg: '#d1fae5', color: '#065f46' },
  elementary: { bg: '#dbeafe', color: '#1e40af' },
  intermediate: { bg: '#ffedd5', color: '#9a3412' },
  advanced: { bg: '#ede9fe', color: '#5b21b6' },
  business: { bg: '#fef3c7', color: '#92400e' },
};

const filteredLessons = computed(() =>
  selectedLevel.value === 'all'
    ? lessons.value
    : lessons.value.filter(l => l.level === selectedLevel.value)
);

const completedCount = computed(() => progress.value.filter(p => p.completed).length);

function isCompleted(lessonId: string) {
  return progress.value.find(p => p.lesson_id === lessonId)?.completed || false;
}

function getScore(lessonId: string) {
  return progress.value.find(p => p.lesson_id === lessonId)?.quiz_score || null;
}

onMounted(async () => {
  await lessonsStore.fetchLessons();
  if (auth.user?.id) await lessonsStore.fetchProgress(auth.user.id);
});
</script>

<template>
  <div class="lessons-container">
    <div class="lessons-header">
      <h1>Aulas de Inglês</h1>
      <p class="subtitle">40 aulas · 60 horas · <span class="completed-count">{{ completedCount }}/40 concluídas</span></p>
    </div>

    <div class="level-filters">
      <button
        v-for="level in levels"
        :key="level.key"
        class="filter-btn"
        :class="{ active: selectedLevel === level.key }"
        @click="selectedLevel = level.key"
      >
        {{ level.label }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Carregando aulas...</span>
    </div>

    <div v-else class="lessons-grid">
      <div
        v-for="lesson in filteredLessons"
        :key="lesson.id"
        class="lesson-card"
        :class="{ completed: isCompleted(lesson.id) }"
        @click="router.push(`/lesson/${lesson.id}`)"
      >
        <div class="card-top">
          <span class="lesson-num">#{{ lesson.order_num }}</span>
          <span
            class="level-badge"
            :style="{ background: levelColors[lesson.level]?.bg, color: levelColors[lesson.level]?.color }"
          >
            {{ lesson.level }}
          </span>
          <span v-if="isCompleted(lesson.id)" class="check">✅</span>
        </div>
        <h3 class="lesson-title">{{ lesson.title }}</h3>
        <div class="card-bottom">
          <span class="duration">⏱ {{ lesson.estimated_minutes }} min</span>
          <span v-if="getScore(lesson.id) !== null" class="score">{{ getScore(lesson.id) }}/5</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lessons-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lessons-header { text-align: center; }
.lessons-header h1 { font-size: 22px; font-weight: 700; color: #f8fafc; }
.subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 4px; }
.completed-count { color: #60a5fa; font-weight: 600; }
.level-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.loading { display: flex; align-items: center; gap: 10px; justify-content: center; color: var(--text-secondary); padding: 40px; }
.spinner { width: 24px; height: 24px; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
@media (min-width: 600px) {
  .lessons-grid { grid-template-columns: repeat(3, 1fr); }
}
.lesson-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  border: 1px solid var(--border);
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lesson-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.lesson-card.completed { border-color: var(--success); }
.card-top { display: flex; align-items: center; gap: 6px; }
.lesson-num { font-size: 11px; color: var(--text-tertiary); font-weight: 600; }
.level-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: capitalize; }
.check { margin-left: auto; font-size: 14px; }
.lesson-title { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.4; flex: 1; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.duration { font-size: 11px; color: var(--text-tertiary); }
.score { font-size: 11px; font-weight: 600; color: var(--accent); }
</style>
