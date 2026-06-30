<script lang="ts">
export default { name: 'PlacementTestView' };
</script>

<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { usePlacementTestStore } from '@/stores/placementTest';
  import { useAuthStore } from '@/stores/auth';
  import { message } from 'ant-design-vue';

  const aceWaving = new URL('../assets/ace/ace-waving.png', import.meta.url).href;
  const aceThinking = new URL('../assets/ace/ace-thinking.png', import.meta.url).href;
  const aceMicrophone = new URL('../assets/ace/ace-microphone.png', import.meta.url).href;
  const aceCelebrating = new URL('../assets/ace/ace-celebrating.png', import.meta.url).href;
  const aceThumbsup = new URL('../assets/ace/ace-thumbsup.png', import.meta.url).href;
  const aceReading = new URL('../assets/ace/ace-reading.png', import.meta.url).href;
  const aceSurprised = new URL('../assets/ace/ace-surprised.png', import.meta.url).href;

  const router = useRouter();
  const store = usePlacementTestStore();
  const auth = useAuthStore();

  // ── State machine ─────────────────────────────────────────────────────────
  type Screen = 'welcome' | 'quiz' | 'pronunciation' | 'interpretation' | 'conversation' | 'result';
  const screen = ref<Screen>('welcome');
  const currentIndex = ref(0);
  const isLoading = ref(false);
  const isRecording = ref(false);
  const hasRecorded = ref(false);
  const audioBlob = ref<Blob | null>(null);
  const audioUrl = ref<string | null>(null);

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const QUIZ_QUESTIONS = [
    {
      question: 'She ___ to school every day.',
      options: { A: 'goes', B: 'go', C: 'gone', D: 'going' },
    },
    {
      question: 'They ___ watching TV when I called.',
      options: { A: 'was', B: 'were', C: 'is', D: 'are' },
    },
    {
      question: 'If I ___ more time, I would learn guitar.',
      options: { A: 'have', B: 'has', C: 'had', D: 'having' },
    },
    {
      question: 'The project was completed ___ schedule.',
      options: { A: 'in', B: 'on', C: 'at', D: 'by' },
    },
    {
      question: 'She speaks English ___.',
      options: { A: 'fluent', B: 'fluently', C: 'fluency', D: 'fluenced' },
    },
  ];

  const selectedAnswer = ref<string | null>(null);
  const quizScores: number[] = [];

  // ── Pronunciation ─────────────────────────────────────────────────────────
  const PRONUNCIATION_PHRASES = [
    'The presentation went really well today.',
    'I would like to schedule a meeting for next week.',
    'Our team delivered excellent results this quarter.',
  ];
  const pronScores: number[] = [];

  // ── Interpretation ────────────────────────────────────────────────────────
  const INTERPRETATION_TEXT =
    'Remote work has become increasingly popular in recent years. Many companies now offer flexible arrangements that allow employees to work from home. While this has improved work-life balance for many workers, it has also created new challenges in team collaboration and communication.';

  const INTERPRETATION_QUESTIONS = [
    'What is the main benefit of remote work mentioned in the text?',
    'What challenge does remote work create, according to the text?',
  ];
  const interpScores: number[] = [];
  const showInterpText = ref(true);

  // ── Conversation ──────────────────────────────────────────────────────────
  const convHistory = ref<{ role: string; content: string }[]>([]);
  const convAiMessage = ref('');
  const convScores: number[] = [];

  // ── Result ────────────────────────────────────────────────────────────────
  const result = ref<{
    level: string;
    level_label: string;
    final_score: number;
    breakdown: Record<string, number>;
  } | null>(null);

  // ── Speech synthesis ──────────────────────────────────────────────────────
  let speakTimer: ReturnType<typeof setTimeout> | null = null;

  function cleanTextForSpeech(text: string): string {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[☀-➿]/gu, '')
      .replace(/#|\*|_|`/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function speakText(text: string) {
    if (speakTimer) clearTimeout(speakTimer);
    window.speechSynthesis.cancel();

    try {
      const clean = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      speakTimer = setTimeout(() => {}, 20000);
    } catch {
      // fallback
    }
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  function getSupportedMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
  }

  function startRecording() {
    if (isRecording.value) return;
    chunks = [];
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = getSupportedMimeType();
        mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const type = mediaRecorder?.mimeType || 'audio/webm';
          audioBlob.value = new Blob(chunks, { type });
          audioUrl.value = URL.createObjectURL(audioBlob.value);
          hasRecorded.value = true;
          stream.getTracks().forEach((t) => t.stop());
          mediaRecorder = null;
        };
        mediaRecorder.start(100);
        isRecording.value = true;
      })
      .catch((err) => {
        message.error('Erro ao acessar microfone: ' + err.message, 4);
      });
  }

  function stopRecording() {
    if (!mediaRecorder || !isRecording.value) return;
    mediaRecorder.stop();
    isRecording.value = false;
  }

  function resetAudio() {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;
  }

  function buildAudioForm(stage: string, extra: Record<string, string> = {}): FormData {
    const form = new FormData();
    form.append('stage', stage);
    if (audioBlob.value) {
      const mimeType = audioBlob.value.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      form.append('file', audioBlob.value, `recording.${ext}`);
    }
    const key = localStorage.getItem('userApiKey');
    if (key) form.append('userApiKey', key);
    const model = localStorage.getItem('userModel');
    if (model) form.append('userModel', model);
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
    return form;
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  const progress = computed(() => {
    if (screen.value === 'welcome') return 0;
    if (screen.value === 'quiz') return Math.round(5 + (currentIndex.value / 5) * 20);
    if (screen.value === 'pronunciation') return Math.round(25 + (currentIndex.value / 3) * 15);
    if (screen.value === 'interpretation') return Math.round(40 + (currentIndex.value / 2) * 15);
    if (screen.value === 'conversation') return Math.round(55 + (currentIndex.value / 3) * 30);
    return 100;
  });

  const isFree = computed(() => (auth.dashboardUser as any)?.plan === 'free');
  const isBlocked = computed(() => !!(auth.dashboardUser as any)?.placement_test_done && isFree.value);

  const aceImage = computed(() => {
    if (isLoading.value) return aceThinking;
    if (isRecording.value) return aceMicrophone;
    if (screen.value === 'welcome') return aceWaving;
    if (screen.value === 'quiz') return aceSurprised;
    if (screen.value === 'pronunciation') return aceMicrophone;
    if (screen.value === 'interpretation') return aceReading;
    if (screen.value === 'conversation') return aceSurprised;
    if (screen.value === 'result') {
      const s = result.value?.final_score ?? 0;
      return s >= 56 ? aceCelebrating : aceThumbsup;
    }
    return aceWaving;
  });

  const stageLabel = computed(() => {
    const map: Record<Screen, string> = {
      welcome: 'Início',
      quiz: 'Gramática',
      pronunciation: 'Pronúncia',
      interpretation: 'Interpretação',
      conversation: 'Conversação',
      result: 'Resultado',
    };
    return map[screen.value];
  });

  // ── Quiz handlers ─────────────────────────────────────────────────────────
  async function submitQuizAnswer() {
    if (!selectedAnswer.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const form = new FormData();
      form.append('stage', 'quiz');
      form.append('answer', selectedAnswer.value);
      form.append('question_index', String(currentIndex.value));
      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);
      const model = localStorage.getItem('userModel');
      if (model) form.append('userModel', model);

      const data = await store.call(form);
      quizScores.push(data.score ?? 0);
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
      nextQuiz();
    }
  }

  function nextQuiz() {
    selectedAnswer.value = null;
    if (currentIndex.value < QUIZ_QUESTIONS.length - 1) {
      currentIndex.value++;
    } else {
      currentIndex.value = 0;
      screen.value = 'pronunciation';
    }
  }

  // ── Pronunciation handlers ────────────────────────────────────────────────
  async function submitPronunciation() {
    if (!audioBlob.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const form = buildAudioForm('pronunciation', {
        question_index: String(currentIndex.value),
      });
      const data = await store.call(form);
      pronScores.push(data.score ?? 0);
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
      nextPronunciation();
    }
  }

  function nextPronunciation() {
    resetAudio();
    if (currentIndex.value < PRONUNCIATION_PHRASES.length - 1) {
      currentIndex.value++;
    } else {
      currentIndex.value = 0;
      showInterpText.value = true;
      screen.value = 'interpretation';
    }
  }

  // ── Interpretation handlers ───────────────────────────────────────────────
  async function submitInterpretation() {
    if (!audioBlob.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const form = buildAudioForm('interpretation', {
        question_index: String(currentIndex.value),
      });
      const data = await store.call(form);
      interpScores.push(data.score ?? 0);
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
      nextInterpretation();
    }
  }

  function nextInterpretation() {
    resetAudio();
    if (currentIndex.value < INTERPRETATION_QUESTIONS.length - 1) {
      currentIndex.value++;
      showInterpText.value = false;
    } else {
      currentIndex.value = 0;
      screen.value = 'conversation';
      startConversation();
    }
  }

  // ── Conversation handlers ─────────────────────────────────────────────────
  async function startConversation() {
    isLoading.value = true;
    try {
      const form = new FormData();
      form.append('stage', 'conversation');
      form.append('question_index', '0');
      form.append('history', '[]');
      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);
      const model = localStorage.getItem('userModel');
      if (model) form.append('userModel', model);

      const data = await store.call(form);
      convAiMessage.value = data.ai_response || '';
      convHistory.value = data.history || [];
      if (convAiMessage.value) speakText(convAiMessage.value);
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
    }
  }

  async function submitConversation() {
    if (!audioBlob.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const form = buildAudioForm('conversation', {
        question_index: String(currentIndex.value),
        history: JSON.stringify(convHistory.value),
      });
      const data = await store.call(form);
      if (data.score) convScores.push(data.score);
      convHistory.value = data.history || convHistory.value;
      convAiMessage.value = data.ai_response || '';
      if (convAiMessage.value) speakText(convAiMessage.value);
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
      nextConversation();
    }
  }

  function nextConversation() {
    resetAudio();
    if (currentIndex.value < 2) {
      currentIndex.value++;
    } else {
      submitResult();
    }
  }

  // ── Result ────────────────────────────────────────────────────────────────
  async function submitResult() {
    isLoading.value = true;
    screen.value = 'result';
    try {
      const avg = (arr: number[]) =>
        arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

      const scores = {
        quiz: avg(quizScores),
        pronunciation: avg(pronScores),
        interpretation: avg(interpScores),
        conversation: avg(convScores),
      };

      const form = new FormData();
      form.append('stage', 'result');
      form.append('scores', JSON.stringify(scores));
      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);

      const data = await store.call(form);
      result.value = {
        level: data.level!,
        level_label: data.level_label!,
        final_score: data.final_score!,
        breakdown: data.breakdown!,
      };

      // Update local auth store
      await auth.fetchUser();
    } catch (err: any) {
      message.error(err.message, 4);
    } finally {
      isLoading.value = false;
    }
  }

  function goToDashboard() {
    router.push('/');
  }

  watch(() => auth.dashboardUser, (user) => {
    if (!user) return;

    // Não verifica bloqueio se já estamos exibindo o resultado do teste atual
    if (screen.value === 'result') return;

    const plan = (user as any)?.plan || 'free';
    const testDone = (user as any)?.placement_test_done;
    const testDoneAt = (user as any)?.placement_test_done_at;

    if (testDone) {
      if (plan === 'free') {
        message.warning('Plano Free permite apenas 1 teste de nivelamento.', 4);
        router.push('/settings');
        return;
      }

      if (testDoneAt) {
        const lastTest = new Date(testDoneAt);
        const now = new Date();
        const diffDays = (now.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          const remaining = Math.ceil(30 - diffDays);
          message.warning(`Você pode refazer o teste em ${remaining} dias.`, 4);
          router.push('/settings');
          return;
        }
      }
    }
  }, { immediate: true });

  onUnmounted(() => {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    window.speechSynthesis.cancel();
    if (speakTimer) clearTimeout(speakTimer);
  });
</script>

<template>
  <div class="pt-container">
    <!-- Progress bar -->
    <div v-if="screen !== 'welcome'" class="progress-wrap">
      <div class="progress-label">
        <span>{{ stageLabel }}</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div class="pt-card">
      <img :src="aceImage" alt="Ace" class="ace" :class="{ pulse: isRecording }" />

      <!-- ── WELCOME ─────────────────────────────────────────────────────── -->
      <template v-if="screen === 'welcome'">
        <div v-if="isBlocked" class="blocked-card">
          <p>Você já realizou o teste de nivelamento.</p>
          <p v-if="isFree">Faça upgrade para realizar um novo teste mensalmente.</p>
          <button class="btn-ghost" @click="router.push('/settings')">Voltar para configurações</button>
        </div>
        <div v-else>
          <h1>Teste de Nivelamento</h1>
          <p class="subtitle">
            O Ace vai avaliar seu inglês em 4 etapas rápidas (5–8 minutos).
          </p>
          <div class="stage-list">
            <div class="stage-item">📝 <span>Gramática — 5 perguntas</span></div>
            <div class="stage-item">🎤 <span>Pronúncia — 3 frases</span></div>
            <div class="stage-item">📖 <span>Interpretação — 2 perguntas</span></div>
            <div class="stage-item">💬 <span>Conversação — 3 turnos</span></div>
          </div>
          <button class="btn-primary" @click="screen = 'quiz'">
            Começar o teste
          </button>
          <button class="btn-ghost" @click="router.push('/')">Voltar</button>
        </div>
      </template>

      <!-- ── QUIZ ───────────────────────────────────────────────────────── -->
      <template v-else-if="screen === 'quiz'">
        <p class="stage-tag">📝 Gramática — {{ currentIndex + 1 }}/{{ QUIZ_QUESTIONS.length }}</p>
        <h2 class="question">{{ QUIZ_QUESTIONS[currentIndex].question }}</h2>

        <div class="options-grid">
          <button
            v-for="(label, key) in QUIZ_QUESTIONS[currentIndex].options"
            :key="key"
            class="option-btn"
            :class="{ selected: selectedAnswer === key }"
            :disabled="isLoading"
            @click="selectedAnswer = key"
          >
            <span class="opt-key">{{ key }}</span>
            <span>{{ label }}</span>
          </button>
        </div>

        <div v-if="isLoading" class="loading-row">
          <div class="spinner"></div><span>Processando...</span>
        </div>
        <button
          v-else
          class="btn-primary"
          :disabled="!selectedAnswer"
          @click="submitQuizAnswer"
        >
          Confirmar
        </button>
      </template>

      <!-- ── PRONUNCIATION ─────────────────────────────────────────────── -->
      <template v-else-if="screen === 'pronunciation'">
        <p class="stage-tag">🎤 Pronúncia — {{ currentIndex + 1 }}/{{ PRONUNCIATION_PHRASES.length }}</p>
        <p class="instr">Leia a frase em voz alta:</p>
        <div class="phrase-box">
          <p>{{ PRONUNCIATION_PHRASES[currentIndex] }}</p>
        </div>

        <div v-if="isLoading" class="loading-row">
          <div class="spinner"></div><span>Processando...</span>
        </div>
        <div v-else class="record-controls">
          <button v-if="!isRecording && !hasRecorded" class="btn-green" @click="startRecording">
            🎤 Gravar
          </button>
          <button v-if="isRecording" class="btn-red" @click="stopRecording">
            ⏹ Parar
          </button>
          <template v-if="hasRecorded && !isRecording">
            <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player"></audio>
            <button class="btn-primary" @click="submitPronunciation">📤 Enviar</button>
            <button class="btn-ghost" @click="resetAudio">🔄 Regravar</button>
          </template>
        </div>
      </template>

      <!-- ── INTERPRETATION ────────────────────────────────────────────── -->
      <template v-else-if="screen === 'interpretation'">
        <p class="stage-tag">📖 Interpretação — {{ currentIndex + 1 }}/{{ INTERPRETATION_QUESTIONS.length }}</p>

        <template v-if="showInterpText && currentIndex === 0">
          <p class="instr">Leia o texto abaixo com atenção:</p>
          <div class="interp-text">
            <p>{{ INTERPRETATION_TEXT }}</p>
          </div>
          <button class="btn-primary" @click="showInterpText = false">
            Já li, responder →
          </button>
        </template>
        <template v-else>
          <p class="instr">Responda por voz:</p>
          <div class="phrase-box">
            <p>{{ INTERPRETATION_QUESTIONS[currentIndex] }}</p>
          </div>

          <div v-if="isLoading" class="loading-row">
            <div class="spinner"></div><span>Processando...</span>
          </div>
          <div v-else class="record-controls">
            <button v-if="!isRecording && !hasRecorded" class="btn-green" @click="startRecording">
              🎤 Gravar resposta
            </button>
            <button v-if="isRecording" class="btn-red" @click="stopRecording">
              ⏹ Parar
            </button>
            <template v-if="hasRecorded && !isRecording">
              <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player"></audio>
              <button class="btn-primary" @click="submitInterpretation">📤 Enviar</button>
              <button class="btn-ghost" @click="resetAudio">🔄 Regravar</button>
            </template>
          </div>
        </template>
      </template>

      <!-- ── CONVERSATION ──────────────────────────────────────────────── -->
      <template v-else-if="screen === 'conversation'">
        <p class="stage-tag">💬 Conversação — turno {{ currentIndex + 1 }}/3</p>

        <div v-if="isLoading" class="loading-row">
          <div class="spinner"></div><span>Ace está pensando...</span>
        </div>

        <template v-else>
          <div v-if="convAiMessage" class="conv-message">
            <p>{{ convAiMessage }}</p>
          </div>

          <div class="record-controls">
            <button v-if="!isRecording && !hasRecorded" class="btn-green" @click="startRecording">
              🎤 Responder
            </button>
            <button v-if="isRecording" class="btn-red" @click="stopRecording">
              ⏹ Parar
            </button>
            <template v-if="hasRecorded && !isRecording">
              <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player"></audio>
              <button class="btn-primary" @click="submitConversation">📤 Enviar</button>
              <button class="btn-ghost" @click="resetAudio">🔄 Regravar</button>
            </template>
          </div>
        </template>
      </template>

      <!-- ── RESULT ─────────────────────────────────────────────────────── -->
      <template v-else-if="screen === 'result'">
        <div v-if="isLoading" class="loading-row">
          <div class="spinner"></div><span>Calculando seu nível...</span>
        </div>

        <template v-else-if="result">
          <h1>Seu nível é:</h1>
          <div class="level-badge">{{ result.level_label }}</div>
          <p class="score-total">Score geral: <strong>{{ result.final_score }}/100</strong></p>

          <div class="breakdown">
            <div class="breakdown-item">
              <span>📝 Gramática</span>
              <span>{{ result.breakdown.quiz }}/100</span>
            </div>
            <div class="breakdown-item">
              <span>🎤 Pronúncia</span>
              <span>{{ result.breakdown.pronunciation }}/100</span>
            </div>
            <div class="breakdown-item">
              <span>📖 Interpretação</span>
              <span>{{ result.breakdown.interpretation }}/100</span>
            </div>
            <div class="breakdown-item">
              <span>💬 Conversação</span>
              <span>{{ result.breakdown.conversation }}/100</span>
            </div>
          </div>

          <p class="result-msg">
            {{ result.final_score >= 76
              ? 'Excelente! Você demonstrou alto domínio do inglês.'
              : result.final_score >= 56
              ? 'Muito bem! Você tem um bom nível de inglês.'
              : result.final_score >= 36
              ? 'Bom começo! Continue praticando para evoluir.'
              : 'Ótimo que você está aqui! Vamos construir juntos.' }}
          </p>

          <button class="btn-primary" @click="goToDashboard">
            Ir para o Dashboard →
          </button>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .pt-container {
    max-width: 560px;
    margin: 0 auto;
    padding: 16px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Progress */
  .progress-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
  }
  .progress-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 10px;
    transition: width 0.4s ease;
  }

  /* Card */
  .pt-card {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 28px 20px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .ace {
    width: 80px;
    height: auto;
  }
  .ace.pulse {
    animation: pulse 0.6s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from { transform: scale(1.04); }
    to { transform: scale(1.1); }
  }

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
    margin: 0;
  }
  h2.question {
    font-size: 17px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
    margin: 0;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;
    margin: 0;
  }

  .stage-list {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 14px 16px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stage-item {
    font-size: 14px;
    color: var(--text-primary);
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .stage-tag {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
    align-self: flex-start;
  }

  .instr {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    align-self: flex-start;
  }

  /* Quiz options */
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }
  .option-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }
  .option-btn:hover:not(:disabled) {
    border-color: var(--accent);
    background: var(--bg-secondary);
  }
  .option-btn.selected {
    border-color: var(--accent);
    background: #dbeafe;
    color: #1d4ed8;
  }
  .option-btn.correct {
    border-color: var(--success);
    background: #d1fae5;
    color: #065f46;
  }
  .option-btn.wrong {
    border-color: var(--danger);
    background: #fee2e2;
    color: #991b1b;
  }
  .opt-key {
    font-weight: 700;
    flex-shrink: 0;
  }

  /* Feedback */
  .feedback-box {
    width: 100%;
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .feedback-box.correct {
    background: #d1fae5;
    border-left: 4px solid var(--success);
  }
  .feedback-box.wrong {
    background: #fee2e2;
    border-left: 4px solid var(--danger);
  }
  .fb-status {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }
  .fb-text {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  /* Phrase / interp text */
  .phrase-box {
    background: var(--bg-secondary);
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 14px 16px;
    width: 100%;
  }
  .phrase-box p {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.5;
    text-align: center;
  }

  .interp-text {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    width: 100%;
  }
  .interp-text p {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.7;
    margin: 0;
    font-weight: 500;
  }

  /* Conversation */
  .conv-message {
    background: var(--bg-secondary);
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 14px 16px;
    width: 100%;
  }
  .conv-message p {
    font-size: 15px;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.6;
    font-weight: 500;
  }

  /* Recording */
  .record-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .audio-player {
    width: 100%;
    border-radius: 8px;
  }

  /* Loading */
  .loading-row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
    font-size: 14px;
  }
  .spinner {
    width: 22px;
    height: 22px;
    border: 2.5px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Result */
  .level-badge {
    font-size: 28px;
    font-weight: 800;
    color: var(--accent);
    padding: 10px 28px;
    border: 3px solid var(--accent);
    border-radius: 50px;
  }
  .score-total {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
  .breakdown {
    width: 100%;
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .breakdown-item {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }
  .result-msg {
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;
    line-height: 1.5;
    margin: 0;
  }

  /* Buttons */
  .btn-primary {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-primary:disabled {
    background: var(--border);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
  .btn-green {
    width: 100%;
    padding: 13px;
    background: var(--success);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-red {
    width: 100%;
    padding: 13px;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    animation: blink 1s ease-in-out infinite alternate;
  }
  @keyframes blink { from { opacity: 1; } to { opacity: 0.8; } }
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
  .btn-ghost:hover { background: var(--bg-secondary); }

  .blocked-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    padding: 8px 0;
  }
  .blocked-card p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
</style>
