<script lang="ts">
  export default { name: 'InterviewView' };
</script>

<script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';

  const aceWaving = new URL('../assets/ace/ace-waving.png', import.meta.url)
    .href;
  const aceThinking = new URL('../assets/ace/ace-thinking.png', import.meta.url)
    .href;

  const router = useRouter();
  const auth = useAuthStore();
  const { user } = storeToRefs(auth);

  const stage = ref<'intro' | 'interview' | 'feedback'>('intro');
  const turn = ref(0);
  const history = ref<{ question: string; answer: string }[]>([]);
  const currentQuestion = ref('');
  const isLoading = ref(false);
  const isRecording = ref(false);
  const isSpeaking = ref(false);
  const feedback = ref<any>(null);
  const errorMsg = ref<string | null>(null);
  const audioBlob = ref<Blob | null>(null);
  const audioUrl = ref<string | null>(null);
  const hasRecorded = ref(false);

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let speakTimer: ReturnType<typeof setTimeout> | null = null;

  const area = computed(() => localStorage.getItem('subject') || 'technology');

  function speakNoBlock(text: string) {
    if (speakTimer) clearTimeout(speakTimer);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => {
      isSpeaking.value = true;
    };
    utterance.onend = () => {
      isSpeaking.value = false;
    };
    utterance.onerror = () => {
      isSpeaking.value = false;
    };
    window.speechSynthesis.speak(utterance);
    speakTimer = setTimeout(() => {
      isSpeaking.value = false;
    }, 20000);
  }

  async function startInterview() {
    stage.value = 'interview';
    turn.value = 0;
    history.value = [];
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;
    await callApi(null);
  }

  async function callApi(audio: Blob | null) {
    isLoading.value = true;
    errorMsg.value = null;
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;

    try {
      const {
        data: { session },
      } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Não autenticado');

      const form = new FormData();
      if (audio) form.append('file', audio, 'recording.webm');
      form.append('area', area.value);
      form.append('turn', String(turn.value + 1));
      form.append('history', JSON.stringify(history.value));
      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);

      const res = await fetch(
        'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/interview',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: form,
        },
      );

      if (!res.ok) throw new Error(`Erro no servidor: ${res.status}`);
      const data = await res.json();

      if (data.is_finished) {
        feedback.value = data.feedback;
        stage.value = 'feedback';
        isLoading.value = false;
        return;
      }

      if (audio && data.transcription) {
        history.value[history.value.length - 1].answer = data.transcription;
      }

      turn.value++;
      currentQuestion.value = data.next_question;
      history.value.push({ question: data.next_question, answer: '' });
      isLoading.value = false;
      speakNoBlock(data.next_question);
    } catch (err: any) {
      errorMsg.value = err.message;
      isLoading.value = false;
    }
  }

  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
    ];
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
          const blob = new Blob(chunks, { type });
          audioBlob.value = blob;
          audioUrl.value = URL.createObjectURL(blob);
          hasRecorded.value = true;
          stream.getTracks().forEach((t) => t.stop());
          mediaRecorder = null;
        };

        mediaRecorder.start(100);
        isRecording.value = true;
      })
      .catch((err) => {
        errorMsg.value = 'Erro ao acessar microfone: ' + err.message;
      });
  }

  function stopRecording() {
    if (!mediaRecorder || !isRecording.value) return;
    mediaRecorder.stop();
    isRecording.value = false;
  }

  async function submitAnswer() {
    if (!audioBlob.value) return;
    await callApi(audioBlob.value);
  }

  function reRecord() {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;
  }

  function restartInterview() {
    stage.value = 'intro';
    turn.value = 0;
    history.value = [];
    currentQuestion.value = '';
    feedback.value = null;
    errorMsg.value = null;
    audioBlob.value = null;
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
    hasRecorded.value = false;
    isSpeaking.value = false;
    window.speechSynthesis.cancel();
  }

  onUnmounted(() => {
    window.speechSynthesis.cancel();
    if (speakTimer) clearTimeout(speakTimer);
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  });
</script>

<template>
  <div class="iv-container">
    <!-- INTRO -->
    <div v-if="stage === 'intro'" class="iv-card">
      <img :src="aceWaving" alt="Ace" class="ace" />
      <h1>Simulação de Entrevista</h1>
      <p class="subtitle">
        Área: <strong>{{ area }}</strong>
      </p>
      <p class="desc">
        O Ace vai conduzir uma entrevista de emprego realista em inglês.
        Responda cada pergunta gravando sua voz. Ao final, você receberá um
        feedback detalhado.
      </p>
      <div class="tags">
        <span>🎤 Entrevista por voz</span>
        <span>💬 8 perguntas</span>
        <span>📊 Feedback com IA</span>
      </div>
      <button class="btn-blue" @click="startInterview">
        Iniciar Entrevista
      </button>
      <button class="btn-ghost" @click="router.push('/')">Voltar</button>
    </div>

    <!-- INTERVIEW -->
    <div v-else-if="stage === 'interview'" class="iv-card">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(turn / 8) * 100}%` }"
        ></div>
      </div>
      <p class="progress-label">Pergunta {{ turn }} de 8</p>

      <img
        :src="isSpeaking ? aceWaving : aceThinking"
        alt="Ace"
        class="ace"
        :class="{ speaking: isSpeaking }"
      />

      <!-- Loading -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Ace está pensando...</span>
      </div>

      <!-- Pergunta -->
      <div v-if="!isLoading && currentQuestion" class="question-box">
        <p>{{ currentQuestion }}</p>
        <button class="btn-repeat" @click="speakNoBlock(currentQuestion)">
          🔊 Ouvir novamente
        </button>
      </div>

      <!-- Erro -->
      <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

      <!-- Controles -->
      <div v-if="!isLoading" class="controls">
        <!-- Gravar -->
        <button
          v-if="!isRecording && !hasRecorded"
          class="btn-green"
          @click="startRecording"
        >
          🎤 Gravar Resposta
        </button>

        <!-- Parar -->
        <button v-if="isRecording" class="btn-red" @click="stopRecording">
          ⏹️ Parar Gravação
        </button>

        <!-- Player + ações pós gravação -->
        <div v-if="hasRecorded && !isRecording" class="recorded-wrap">
          <audio
            v-if="audioUrl"
            :src="audioUrl"
            controls
            class="audio-player"
          ></audio>
          <button class="btn-blue" @click="submitAnswer">
            📤 Enviar Resposta
          </button>
          <button class="btn-ghost" @click="reRecord">
            🔄 Gravar Novamente
          </button>
        </div>
      </div>
    </div>

    <!-- FEEDBACK -->
    <div v-else-if="stage === 'feedback'" class="iv-card">
      <img :src="aceWaving" alt="Ace" class="ace" />
      <h1>Entrevista Concluída!</h1>

      <div v-if="feedback" class="feedback-wrap">
        <div class="score-card">
          <p class="score-label">Pontuação Geral</p>
          <p
            class="score-value"
            :class="{
              green: feedback.score >= 14,
              yellow: feedback.score >= 8 && feedback.score < 14,
              red: feedback.score < 8,
            }"
          >
            {{ feedback.score }}/20
          </p>
        </div>

        <div class="fb-section" v-if="feedback.summary">
          <p>{{ feedback.summary }}</p>
        </div>

        <div class="fb-section" v-if="feedback.strengths?.length">
          <h3>✅ Pontos fortes</h3>
          <ul>
            <li v-for="s in feedback.strengths" :key="s">{{ s }}</li>
          </ul>
        </div>

        <div class="fb-section" v-if="feedback.improvements?.length">
          <h3>📈 Pontos a melhorar</h3>
          <ul>
            <li v-for="i in feedback.improvements" :key="i">{{ i }}</li>
          </ul>
        </div>

        <div class="fb-section" v-if="feedback.recommendation">
          <h3>💡 Recomendação</h3>
          <p>{{ feedback.recommendation }}</p>
        </div>
      </div>

      <button class="btn-blue" @click="restartInterview">
        Nova Entrevista
      </button>
      <button class="btn-ghost" @click="router.push('/')">
        Voltar ao Dashboard
      </button>
    </div>
  </div>
</template>

<style scoped>
  .iv-container {
    max-width: 560px;
    margin: 0 auto;
    padding: 24px 16px 80px;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .iv-card {
    background: white;
    border-radius: 20px;
    padding: 28px 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #111;
    text-align: center;
    margin: 0;
  }
  .subtitle {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }
  .desc {
    font-size: 13px;
    color: #374151;
    text-align: center;
    line-height: 1.6;
    margin: 0;
  }
  .tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .tags span {
    background: #f3f4f6;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: #374151;
  }
  .ace {
    width: 90px;
    height: auto;
  }
  .ace.speaking {
    animation: pulse 0.6s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from {
      transform: scale(1.04);
    }
    to {
      transform: scale(1.1);
    }
  }
  .progress-bar {
    width: 100%;
    height: 5px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #1d4ed8;
    border-radius: 10px;
    transition: width 0.4s;
  }
  .progress-label {
    font-size: 11px;
    color: #9ca3af;
    align-self: flex-end;
    margin: 0;
  }
  .loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #6b7280;
    font-size: 14px;
  }
  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid #e5e7eb;
    border-top-color: #1d4ed8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .question-box {
    background: #f0f4ff;
    border-left: 4px solid #1d4ed8;
    border-radius: 8px;
    padding: 14px 18px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .question-box p {
    font-size: 15px;
    color: #1e3a8a;
    line-height: 1.6;
    font-weight: 500;
    margin: 0;
  }
  .btn-repeat {
    background: none;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    align-self: flex-start;
  }
  .btn-repeat:hover {
    background: #eff6ff;
  }
  .error-box {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    width: 100%;
    text-align: center;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .recorded-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .audio-player {
    width: 100%;
    border-radius: 8px;
  }
  .btn-blue {
    width: 100%;
    padding: 13px;
    background: #1d4ed8;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-blue:hover {
    background: #1e40af;
  }
  .btn-blue:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
  .btn-green {
    width: 100%;
    padding: 13px;
    background: #059669;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-green:hover {
    background: #047857;
  }
  .btn-red {
    width: 100%;
    padding: 13px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    animation: blink 1s ease-in-out infinite alternate;
  }
  @keyframes blink {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.8;
    }
  }
  .btn-ghost {
    width: 100%;
    padding: 11px;
    background: transparent;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-ghost:hover {
    background: #f9fafb;
  }
  .feedback-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }
  .score-card {
    text-align: center;
    padding: 20px;
    background: #f9fafb;
    border-radius: 12px;
  }
  .score-label {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 6px;
  }
  .score-value {
    font-size: 42px;
    font-weight: 800;
  }
  .score-value.green {
    color: #16a34a;
  }
  .score-value.yellow {
    color: #ca8a04;
  }
  .score-value.red {
    color: #dc2626;
  }
  .fb-section {
    background: #f9fafb;
    border-radius: 12px;
    padding: 14px;
    width: 100%;
  }
  .fb-section h3 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #111;
  }
  .fb-section p {
    font-size: 13px;
    color: #374151;
    line-height: 1.6;
    margin: 0;
  }
  .fb-section ul {
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .fb-section li {
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
  }
</style>
