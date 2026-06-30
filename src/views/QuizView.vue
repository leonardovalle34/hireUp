<script lang="ts">
export default { name: 'QuizView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuizStore } from '@/stores/quiz';
import { storeToRefs } from 'pinia';
import { message } from 'ant-design-vue';

const router = useRouter();
const auth = useAuthStore();
const quizStore = useQuizStore();
const { currentQuestion, questions, currentIndex, score, loading, progress, isLastQuestion, usageToday } = storeToRefs(quizStore);

const stage = ref<'intro' | 'quiz' | 'result'>('intro');
const selectedLevel = ref('');
const selectedAnswer = ref<number | null>(null);
const showExplanation = ref(false);
const wasCorrect = ref(false);

const levels = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'elementary', label: 'Elementary' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'business', label: 'Business' },
];

const userPlan = computed(() => (auth.dashboardUser as any)?.plan || 'free');
const dailyLimit = computed(() => quizStore.getDailyLimit(userPlan.value));
const remainingToday = computed(() => {
  if (dailyLimit.value === null) return null;
  return Math.max(0, dailyLimit.value - usageToday.value);
});
const canPlay = computed(() => dailyLimit.value === null || remainingToday.value! > 0);

async function startQuiz(level: string) {
  if (!canPlay.value) {
    message.warning('Você atingiu o limite diário de quiz. Faça upgrade para mais perguntas!', 4);
    return;
  }

  selectedLevel.value = level;
  if (!auth.user?.id) return;

  const questionCount = dailyLimit.value === null ? 10 : Math.min(10, remainingToday.value!);
  await quizStore.loadQuestions(auth.user.id, level, questionCount);

  if (questions.value.length === 0) {
    message.info('Você já respondeu todas as perguntas deste nível! Parabéns!', 4);
    return;
  }

  stage.value = 'quiz';
  selectedAnswer.value = null;
  showExplanation.value = false;
}

async function selectAnswer(index: number) {
  if (selectedAnswer.value !== null || !auth.user?.id) return;
  selectedAnswer.value = index;
  wasCorrect.value = await quizStore.answerQuestion(auth.user.id, index);
  showExplanation.value = true;
}

function nextQuestion() {
  if (isLastQuestion.value) {
    stage.value = 'result';
  } else {
    quizStore.nextQuestion();
    selectedAnswer.value = null;
    showExplanation.value = false;
  }
}

function restart() {
  stage.value = 'intro';
}

onMounted(async () => {
  if (auth.user?.id) {
    await quizStore.fetchUsageToday(auth.user.id);
  }
});
</script>

<template>
  <div class="quiz-container">

    <!-- INTRO -->
    <div v-if="stage === 'intro'" class="quiz-card">
      <h1>🧠 Quiz Rápido</h1>
      <p class="subtitle">Pratique gramática e vocabulário com perguntas rápidas</p>

      <div v-if="dailyLimit !== null" class="usage-info" :class="{ blocked: !canPlay }">
        <span v-if="canPlay">{{ remainingToday }} perguntas restantes hoje</span>
        <span v-else>Limite diário atingido — volte amanhã ou faça upgrade</span>
      </div>
      <div v-else class="usage-info unlimited">
        ✨ Perguntas ilimitadas no seu plano
      </div>

      <p class="level-label">Escolha o nível:</p>
      <div class="level-grid">
        <button
          v-for="level in levels"
          :key="level.key"
          class="level-btn"
          :disabled="!canPlay"
          @click="startQuiz(level.key)"
        >
          {{ level.label }}
        </button>
      </div>

      <button v-if="!canPlay" class="btn-upgrade" @click="router.push('/pricing')">
        ⚡ Fazer upgrade para mais perguntas
      </button>

      <button class="btn-ghost" @click="router.push('/')">Voltar</button>
    </div>

    <!-- QUIZ -->
    <div v-else-if="stage === 'quiz' && currentQuestion" class="quiz-card">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="progress-label">Pergunta {{ currentIndex + 1 }} de {{ questions.length }}</p>

      <p class="question-text">{{ currentQuestion.question }}</p>

      <div class="options">
        <button
          v-for="(option, i) in currentQuestion.options"
          :key="i"
          class="option-btn"
          :class="{
            correct: selectedAnswer !== null && i === currentQuestion.answer,
            wrong: selectedAnswer === i && i !== currentQuestion.answer,
          }"
          :disabled="selectedAnswer !== null"
          @click="selectAnswer(i)"
        >
          {{ option }}
        </button>
      </div>

      <div v-if="showExplanation" class="explanation-box" :class="{ correct: wasCorrect, wrong: !wasCorrect }">
        <p class="explanation-title">{{ wasCorrect ? '✅ Correto!' : '❌ Incorreto' }}</p>
        <p class="explanation-text">{{ currentQuestion.explanation }}</p>
      </div>

      <button v-if="showExplanation" class="btn-blue" @click="nextQuestion">
        {{ isLastQuestion ? 'Ver resultado' : 'Próxima pergunta →' }}
      </button>
    </div>

    <!-- RESULT -->
    <div v-else-if="stage === 'result'" class="quiz-card">
      <h1>Resultado</h1>
      <div class="result-score">{{ score }}/{{ questions.length }}</div>
      <p class="result-msg">
        {{ score === questions.length ? '🎉 Perfeito! Você acertou tudo!' : score >= questions.length / 2 ? '👍 Bom trabalho!' : '💪 Continue praticando!' }}
      </p>
      <button class="btn-blue" @click="restart">🔄 Jogar novamente</button>
      <button class="btn-ghost" @click="router.push('/')">Voltar ao Dashboard</button>
    </div>

  </div>
</template>

<style scoped>
.quiz-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.quiz-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--card-shadow);
}
h1 { font-size: 20px; font-weight: 700; color: var(--text-primary); text-align: center; margin: 0; }
.subtitle { font-size: 13px; color: var(--text-secondary); text-align: center; margin: 0; }
.usage-info {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--accent);
}
.usage-info.unlimited { background: #d1fae5; color: #065f46; }
.usage-info.blocked { background: #fee2e2; color: #991b1b; }
.level-label { font-size: 13px; color: var(--text-secondary); margin: 8px 0 0; }
.level-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.level-btn {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.level-btn:hover:not(:disabled) { border-color: var(--accent); background: var(--card-bg); }
.level-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-upgrade {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: var(--success);
  border: 1px solid var(--success);
  border-radius: 12px;
  font-size: 14px;
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
.progress-bar { height: 5px; background: var(--border); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 10px; transition: width 0.3s; }
.progress-label { font-size: 11px; color: var(--text-tertiary); margin: 0; }
.question-text { font-size: 16px; font-weight: 600; color: var(--text-primary); line-height: 1.5; margin: 8px 0; }
.options { display: flex; flex-direction: column; gap: 8px; }
.option-btn {
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
.option-btn:disabled { cursor: default; }
.option-btn.correct { background: #d1fae5; border-color: #10b981; color: #065f46; }
.option-btn.wrong { background: #fee2e2; border-color: #ef4444; color: #991b1b; }
.explanation-box { padding: 14px; border-radius: 10px; background: var(--bg-secondary); border-left: 4px solid var(--accent); }
.explanation-box.correct { border-left-color: #10b981; }
.explanation-box.wrong { border-left-color: #ef4444; }
.explanation-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; color: var(--text-primary); }
.explanation-text { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
.btn-blue { width: 100%; padding: 13px; background: var(--accent); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
.result-score { font-size: 48px; font-weight: 800; color: var(--accent); text-align: center; }
.result-msg { font-size: 15px; color: var(--text-primary); text-align: center; margin: 0; }
</style>
