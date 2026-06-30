<script lang="ts">
export default { name: 'LessonView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useLessonsStore } from '@/stores/lessons';
import { getLessonById } from '@/services/lessons';
import type { Lesson } from '@/interfaces/ILesson';
import { message } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const lessonsStore = useLessonsStore();

const lesson = ref<Lesson | null>(null);
const loading = ref(true);
const activeTab = ref<'explanation' | 'examples' | 'quiz'>('explanation');

// Quiz state
const currentQuestion = ref(0);
const selectedAnswer = ref<number | null>(null);
const answers = ref<boolean[]>([]);
const quizDone = ref(false);
const score = computed(() => answers.value.filter(Boolean).length);

const levelColors: Record<string, { bg: string; color: string }> = {
  beginner: { bg: '#d1fae5', color: '#065f46' },
  elementary: { bg: '#dbeafe', color: '#1e40af' },
  intermediate: { bg: '#ffedd5', color: '#9a3412' },
  advanced: { bg: '#ede9fe', color: '#5b21b6' },
  business: { bg: '#fef3c7', color: '#92400e' },
};

function formatExplanation(text: string) {
  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      if (line === '') return '<br>';
      return `<p>${line}</p>`;
    })
    .join('');
}

function selectAnswer(index: number) {
  if (selectedAnswer.value !== null) return;
  selectedAnswer.value = index;
  const correct = index === lesson.value!.quiz[currentQuestion.value].answer;
  answers.value.push(correct);
}

function nextQuestion() {
  if (currentQuestion.value < lesson.value!.quiz.length - 1) {
    currentQuestion.value++;
    selectedAnswer.value = null;
  } else {
    quizDone.value = true;
    saveProgress();
  }
}

function retryQuiz() {
  currentQuestion.value = 0;
  selectedAnswer.value = null;
  answers.value = [];
  quizDone.value = false;
}

async function saveProgress() {
  if (!auth.user?.id || !lesson.value) return;
  try {
    await lessonsStore.saveProgress(auth.user.id, lesson.value.id, score.value);
  } catch (err: any) {
    message.error('Erro ao salvar progresso.', 3);
  }
}

function practiceWithTutor() {
  if (!lesson.value) return;
  localStorage.setItem('tutorTopic', lesson.value.tutor_topic);
  router.push('/tutor');
}

onMounted(async () => {
  try {
    const id = route.params.id as string;
    lesson.value = await getLessonById(id);
  } catch {
    message.error('Aula não encontrada.', 3);
    router.push('/lessons');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="lesson-container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="lesson" class="lesson-card">
      <!-- Header -->
      <div class="lesson-header">
        <button class="btn-back" @click="router.push('/lessons')">← Voltar</button>
        <span class="lesson-num">Aula {{ lesson.order_num }} de 40</span>
      </div>

      <!-- Progress -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(lesson.order_num / 40) * 100}%` }"></div>
      </div>

      <!-- Title -->
      <div class="lesson-info">
        <span
          class="level-badge"
          :style="{ background: levelColors[lesson.level]?.bg, color: levelColors[lesson.level]?.color }"
        >
          {{ lesson.level }}
        </span>
        <h1>{{ lesson.title }}</h1>
        <p class="objective">{{ lesson.objective }}</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'explanation' }" @click="activeTab = 'explanation'">📖 Explicação</button>
        <button class="tab" :class="{ active: activeTab === 'examples' }" @click="activeTab = 'examples'">💬 Exemplos</button>
        <button class="tab" :class="{ active: activeTab === 'quiz' }" @click="activeTab = 'quiz'">✏️ Quiz</button>
      </div>

      <!-- Explanation Tab -->
      <div v-if="activeTab === 'explanation'" class="tab-content">
        <div class="explanation" v-html="formatExplanation(lesson.explanation)"></div>
      </div>

      <!-- Examples Tab -->
      <div v-if="activeTab === 'examples'" class="tab-content">
        <div v-for="(ex, i) in lesson.examples" :key="i" class="example-card">
          <p class="example-en">{{ ex.en }}</p>
          <p class="example-pt">{{ ex.pt }}</p>
        </div>
      </div>

      <!-- Quiz Tab -->
      <div v-if="activeTab === 'quiz'" class="tab-content">
        <!-- Quiz in progress -->
        <div v-if="!quizDone">
          <p class="quiz-progress">Pergunta {{ currentQuestion + 1 }} de {{ lesson.quiz.length }}</p>
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" :style="{ width: `${((currentQuestion + 1) / lesson.quiz.length) * 100}%` }"></div>
          </div>
          <p class="quiz-question">{{ lesson.quiz[currentQuestion].question }}</p>
          <div class="quiz-options">
            <button
              v-for="(option, i) in lesson.quiz[currentQuestion].options"
              :key="i"
              class="quiz-option"
              :class="{
                correct: selectedAnswer !== null && i === lesson.quiz[currentQuestion].answer,
                wrong: selectedAnswer === i && i !== lesson.quiz[currentQuestion].answer,
                selected: selectedAnswer === i,
              }"
              :disabled="selectedAnswer !== null"
              @click="selectAnswer(i)"
            >
              {{ option }}
            </button>
          </div>
          <button
            v-if="selectedAnswer !== null"
            class="btn-next"
            @click="nextQuestion"
          >
            {{ currentQuestion < lesson.quiz.length - 1 ? 'Próxima →' : 'Ver resultado' }}
          </button>
        </div>

        <!-- Quiz done -->
        <div v-else class="quiz-result">
          <div class="result-score" :class="{ success: score >= 4, fail: score < 4 }">
            {{ score }}/5
          </div>
          <p v-if="score >= 4" class="result-msg">🎉 Parabéns! Você concluiu esta aula!</p>
          <p v-else class="result-msg">💪 Quase lá! Você precisa de 4/5 para concluir. Tente novamente!</p>
          <button v-if="score < 4" class="btn-blue" @click="retryQuiz">🔄 Tentar novamente</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="lesson-actions">
        <button class="btn-tutor" @click="practiceWithTutor">🎓 Praticar com o Tutor</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lesson-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.loading { display: flex; justify-content: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.lesson-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 24px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--card-shadow);
}
.lesson-header { display: flex; align-items: center; justify-content: space-between; }
.btn-back { background: none; border: none; color: var(--accent); font-size: 14px; cursor: pointer; font-weight: 500; }
.lesson-num { font-size: 12px; color: var(--text-tertiary); }
.progress-bar { height: 4px; background: var(--border); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 10px; transition: width 0.3s; }
.lesson-info { display: flex; flex-direction: column; gap: 8px; }
.level-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 10px; width: fit-content; text-transform: capitalize; }
.lesson-info h1 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; }
.objective { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
.tabs { display: flex; gap: 4px; background: var(--bg-secondary); border-radius: 10px; padding: 4px; }
.tab { flex: 1; padding: 8px 4px; border: none; background: none; color: var(--text-secondary); font-size: 12px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.tab.active { background: var(--card-bg); color: var(--accent); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.tab-content { display: flex; flex-direction: column; gap: 10px; }
.explanation { font-size: 14px; color: var(--text-primary); line-height: 1.7; }
.explanation :deep(p) { margin-bottom: 8px; }
.explanation :deep(li) { margin-left: 16px; margin-bottom: 4px; list-style: disc; color: var(--text-secondary); }
.explanation :deep(strong) { color: var(--text-primary); font-weight: 600; }
.example-card { background: var(--bg-secondary); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; padding: 12px 14px; }
.example-en { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.example-pt { font-size: 13px; color: var(--text-secondary); margin: 0; }
.quiz-progress { font-size: 12px; color: var(--text-tertiary); margin: 0; }
.quiz-progress-bar { height: 3px; background: var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
.quiz-progress-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
.quiz-question { font-size: 15px; font-weight: 600; color: var(--text-primary); line-height: 1.5; margin: 0 0 14px; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-option {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}
.quiz-option:disabled { cursor: default; }
.quiz-option.correct { background: #d1fae5; border-color: #10b981; color: #065f46; }
.quiz-option.wrong { background: #fee2e2; border-color: #ef4444; color: #991b1b; }
.btn-next { width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 12px; }
.quiz-result { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
.result-score { font-size: 48px; font-weight: 800; }
.result-score.success { color: var(--success); }
.result-score.fail { color: var(--danger); }
.result-msg { font-size: 15px; color: var(--text-primary); text-align: center; margin: 0; }
.btn-blue { width: 100%; padding: 13px; background: var(--accent); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
.lesson-actions { display: flex; flex-direction: column; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border); }
.btn-tutor { width: 100%; padding: 13px; background: transparent; color: var(--accent); border: 1px solid var(--accent); border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-tutor:hover { background: var(--bg-secondary); }
</style>
