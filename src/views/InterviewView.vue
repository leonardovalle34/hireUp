<script lang="ts">
  export default { name: 'InterviewView' };
</script>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useInterviewStore } from '@/stores/interview';
  import { storeToRefs } from 'pinia';
  import { message } from 'ant-design-vue';
  import SpeakingAvatar from '@/components/SpeakingAvatar/SpeakingAvatar.vue';

  const aceWaving = new URL('../assets/ace/ace-waving.png', import.meta.url)
    .href;
  const aceCelebrating = new URL(
    '../assets/ace/ace-celebrating.png',
    import.meta.url,
  ).href;
  const aceThumbsup = new URL('../assets/ace/ace-thumbsup.png', import.meta.url)
    .href;
  const aceSad = new URL('../assets/ace/ace-sad.png', import.meta.url).href;

  const router = useRouter();
  const auth = useAuthStore();
  const interviewStore = useInterviewStore();
  const { user, dashboardUser } = storeToRefs(auth);

  const stage = ref<'intro' | 'interview' | 'feedback'>('intro');
  const turn = ref(0);
  const history = ref<{ question: string; answer: string }[]>([]);
  const currentQuestion = ref('');
  const isLoading = ref(false);
  const isRecording = ref(false);
  const speakingAvatarRef = ref<InstanceType<typeof SpeakingAvatar> | null>(
    null,
  );
  const feedback = ref<any>(null);
  const audioBlob = ref<Blob | null>(null);
  const audioUrl = ref<string | null>(null);
  const hasRecorded = ref(false);
  const activeModel = ref('');
  const activeModelLabel = ref('Claude Haiku');

  const modelLabels: Record<string, string> = {
    'claude-haiku-4-5-20251001': 'Claude Haiku',
    'claude-sonnet-4-6': 'Claude Sonnet',
    'claude-opus-4-6': 'Claude Opus',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o': 'GPT-4o',
  };

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  const area = 'general'; // A IA descobre a área na primeira pergunta

  const aceFeedbackImage = computed(() => {
    if (!feedback.value) return aceWaving;
    if (feedback.value.score >= 14) return aceCelebrating;
    if (feedback.value.score >= 8) return aceThumbsup;
    return aceSad;
  });

  async function startInterview() {
    isLoading.value = true;

    const model = localStorage.getItem('userModel') || '';
    const key = localStorage.getItem('userApiKey') || '';

    // Free plan with an API key — block
    const plan = (dashboardUser.value as any)?.plan || 'free';
    if (plan === 'free' && key) {
      message.warning('API key própria não está disponível no plano Free.', 4);
      isLoading.value = false;
      return;
    }

    // External model without a key — block
    if (model && !key) {
      message.warning(
        `Você selecionou ${activeModelLabel.value} mas não adicionou uma API key. Vá em Configurações → API Key própria.`,
        6,
      );
      isLoading.value = false;
      return;
    }

    try {
      // Has an API key → unlimited, skip the plan check
      if (!key) {
        const canStart = await interviewStore.canStart(user.value?.id || '');
        if (!canStart) {
          router.push('/pricing');
          return;
        }
      }

      stage.value = 'interview';
      turn.value = 0;
      history.value = [];
      audioBlob.value = null;
      audioUrl.value = null;
      hasRecorded.value = false;
      isLoading.value = false;
      await callApi(null);
    } catch (err: any) {
      message.error(err.message || 'Erro ao iniciar entrevista.', 5);
      isLoading.value = false;
    }
  }

  async function callApi(audio: Blob | null) {
    isLoading.value = true;
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;

    try {
      const form = new FormData();

      if (audio) {
        const mimeType = audio.type || 'audio/webm';
        let extension = 'webm';
        if (
          mimeType.includes('mp4') ||
          mimeType.includes('m4a') ||
          mimeType.includes('aac')
        )
          extension = 'mp4';
        else if (mimeType.includes('ogg')) extension = 'ogg';
        else if (mimeType.includes('wav')) extension = 'wav';
        else if (mimeType.includes('mpeg') || mimeType.includes('mp3'))
          extension = 'mp3';
        form.append('file', audio, `recording.${extension}`);
      }

      form.append('area', area);
      form.append('turn', String(turn.value + 1));
      form.append('history', JSON.stringify(history.value));

      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);

      const model = localStorage.getItem('userModel');
      if (model) form.append('userModel', model);

      const data = await interviewStore.sendTurn(form);

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
      currentQuestion.value = data.next_question!;
      history.value.push({ question: data.next_question!, answer: '' });
      isLoading.value = false;
    } catch (err: any) {
      const errMsg = interviewStore.error || err.message || '';
      if (
        errMsg.includes('API key') ||
        errMsg.includes('401') ||
        errMsg.includes('403')
      ) {
        message.error(
          'Erro com sua API key. Verifique em Configurações → API Key própria.',
          6,
        );
      } else {
        message.error(
          'Erro de comunicação com o servidor. Tente novamente.',
          4,
        );
      }
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
        message.error('Erro ao acessar microfone: ' + err.message, 5);
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
    audioBlob.value = null;
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
    hasRecorded.value = false;
    window.speechSynthesis.cancel();

    // Refresh the model when going back to intro
    const saved = localStorage.getItem('userModel') || '';
    activeModel.value = saved;
    activeModelLabel.value = modelLabels[saved] || 'Claude Haiku';
  }

  onMounted(() => {
    const saved = localStorage.getItem('userModel') || '';
    activeModel.value = saved;
    activeModelLabel.value = modelLabels[saved] || 'Claude Haiku';
  });

  onUnmounted(() => {
    window.speechSynthesis.cancel();
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  });
</script>

<template>
  <div class="iv-container">
    <!-- INTRO -->
    <div v-if="stage === 'intro'" class="iv-card">
      <img :src="aceWaving" alt="Ace" class="ace" />
      <h1>Simulação de Entrevista</h1>

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

      <div
        class="model-badge"
        :class="activeModel ? 'model-custom' : 'model-default'"
      >
        <span v-if="!activeModel">🤖 Claude Haiku — incluso no plano</span>
        <span v-else>🔑 {{ activeModelLabel }} — usando sua API key</span>
      </div>

      <button class="btn-blue" :disabled="isLoading" @click="startInterview">
        {{ isLoading ? 'Verificando...' : 'Iniciar Entrevista' }}
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

      <SpeakingAvatar
        :text="currentQuestion"
        :auto-speak="true"
        ref="speakingAvatarRef"
      />

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Ace está pensando...</span>
      </div>

      <div v-if="!isLoading && currentQuestion" class="question-box">
        <p>{{ currentQuestion }}</p>
      </div>

      <div v-if="!isLoading" class="controls">
        <button
          v-if="!isRecording && !hasRecorded"
          class="btn-green"
          @click="startRecording"
        >
          🎤 Gravar Resposta
        </button>
        <button v-if="isRecording" class="btn-red" @click="stopRecording">
          ⏹️ Parar Gravação
        </button>
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
      <img :src="aceFeedbackImage" alt="Ace" class="ace" />
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
    background: var(--card-bg);
    border-radius: 20px;
    padding: 28px 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: var(--card-shadow);
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
    margin: 0;
  }
  .subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }
  .desc {
    font-size: 13px;
    color: var(--text-secondary);
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
    background: var(--bg-secondary);
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .ace {
    width: 90px;
    height: auto;
  }
  .model-badge {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  .model-default {
    background: #d1fae5;
    color: #065f46;
  }
  .model-custom {
    background: #fef9c3;
    color: #854d0e;
  }
  .progress-bar {
    width: 100%;
    height: 5px;
    background: var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 10px;
    transition: width 0.4s;
  }
  .progress-label {
    font-size: 11px;
    color: var(--text-tertiary);
    align-self: flex-end;
    margin: 0;
  }
  .loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
    font-size: 14px;
  }
  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--border);
    border-top-color: var(--accent);
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
    background: var(--bg-secondary);
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 14px 18px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .question-box p {
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.6;
    font-weight: 500;
    margin: 0;
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
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-blue:hover {
    background: var(--accent-hover);
  }
  .btn-blue:disabled {
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
  .btn-green:hover {
    opacity: 0.9;
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
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-ghost:hover {
    background: var(--bg-secondary);
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
    background: var(--bg-secondary);
    border-radius: 12px;
  }
  .score-label {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }
  .score-value {
    font-size: 42px;
    font-weight: 800;
  }
  .score-value.green {
    color: var(--success);
  }
  .score-value.yellow {
    color: var(--warning);
  }
  .score-value.red {
    color: var(--danger);
  }
  .fb-section {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 14px;
    width: 100%;
  }
  .fb-section h3 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
  }
  .fb-section p {
    font-size: 13px;
    color: var(--text-secondary);
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
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
