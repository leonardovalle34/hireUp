<script lang="ts">
  export default { name: 'TutorView' };
</script>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useTutorStore } from '@/stores/tutor';
  import { storeToRefs } from 'pinia';
  import { message } from 'ant-design-vue';

  const aceWaving = new URL('../assets/ace/ace-waving.png', import.meta.url)
    .href;
  const aceThinking = new URL('../assets/ace/ace-thinking.png', import.meta.url)
    .href;
  const aceMicrophone = new URL(
    '../assets/ace/ace-microphone.png',
    import.meta.url,
  ).href;
  const aceSurprised = new URL(
    '../assets/ace/ace-surprised.png',
    import.meta.url,
  ).href;

  const router = useRouter();
  const auth = useAuthStore();
  const tutorStore = useTutorStore();
  const { dashboardUser } = storeToRefs(auth);

  const stage = ref<'intro' | 'session'>('intro');
  const mode = ref<'free' | 'lesson'>('free');
  const topic = ref('');
  const history = ref<{ role: string; content: string }[]>([]);
  const isLoading = ref(false);
  const isRecording = ref(false);
  const isSpeaking = ref(false);
  const questionReady = ref(false);
  const tutorMessage = ref('');
  const tutorName = ref('');
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
  let speakTimer: ReturnType<typeof setTimeout> | null = null;
  let sessionStartTime: number | null = null;

  const TUTOR_DAILY_LIMIT_MS = 30 * 60 * 1000;

  function getTutorTimeUsedToday(): number {
    const key = `tutor_time_${new Date().toISOString().split('T')[0]}`;
    return parseInt(localStorage.getItem(key) || '0');
  }

  function addTutorTime(ms: number) {
    const key = `tutor_time_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(key, String(getTutorTimeUsedToday() + ms));
  }

  const level = computed(
    () => (dashboardUser.value as any)?.english_level || 'beginner',
  );

  const tutorInfo = computed(() => {
    const infos: Record<
      string,
      { name: string; description: string; flag: string }
    > = {
      beginner: {
        name: 'Ana',
        description: 'Tutora para iniciantes — fala português e inglês',
        flag: '🇧🇷',
      },
      elementary: {
        name: 'Carlos',
        description: 'Tutor elementar — mistura português e inglês',
        flag: '🌎',
      },
      intermediate: {
        name: 'James',
        description: 'Tutor intermediário — quase só inglês',
        flag: '🇺🇸',
      },
      advanced: {
        name: 'Sarah',
        description: 'Tutora avançada — só inglês',
        flag: '🇬🇧',
      },
    };
    return infos[level.value] || infos.beginner;
  });

  const aceImage = computed(() => {
    if (isLoading.value) return aceThinking;
    if (isSpeaking.value) return aceMicrophone;
    if (stage.value === 'intro') return aceWaving;
    return aceSurprised;
  });

  const lessonTopics = [
    'Present Simple vs Present Continuous',
    'Past Simple vs Past Perfect',
    'Modal Verbs (can, could, should, must)',
    'Conditional Sentences (If clauses)',
    'Vocabulary: Work and Career',
    'Vocabulary: Travel and Tourism',
    'Phrasal Verbs',
    'Business English',
    'Pronunciation Practice',
    'Idioms and Expressions',
  ];

  function speakTutor(text: string) {
    if (speakTimer) clearTimeout(speakTimer);
    window.speechSynthesis.cancel();
    questionReady.value = true;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) return;

    try {
      const clean = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang =
        level.value === 'beginner' || level.value === 'elementary'
          ? 'pt-BR'
          : 'en-US';
      utterance.rate = 1.1; // um pouco mais rápido
      utterance.pitch = level.value === 'advanced' ? 1.1 : 0.9;
      utterance.volume = 1;

      utterance.onstart = () => {
        isSpeaking.value = true;
        questionReady.value = false;
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
      }, 30000);
    } catch {
      // fallback
    }
  }

  function cleanTextForSpeech(text: string): string {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // remove emojis
      .replace(/[\u2600-\u27BF]/gu, '') // remove símbolos
      .replace(/#/g, '') // remove cerquilha
      .replace(/\*/g, '') // remove asterisco
      .replace(/_/g, '') // remove underscore
      .replace(/`/g, '') // remove backtick
      .replace(/\n+/g, '. ') // quebras de linha viram pausa
      .replace(/\s+/g, ' ') // espaços duplos
      .trim();
  }

  function speakText(text: string) {
    if (speakTimer) clearTimeout(speakTimer);
    window.speechSynthesis.cancel();
    questionReady.value = false;

    try {
      const clean = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang =
        level.value === 'beginner' || level.value === 'elementary'
          ? 'pt-BR'
          : 'en-US';
      utterance.rate = 1.1;
      utterance.pitch = level.value === 'advanced' ? 1.1 : 0.9;
      utterance.volume = 1;

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
      }, 30000);
    } catch {
      isSpeaking.value = false;
    }
  }

  async function startSession() {
    const plan = (dashboardUser.value as any)?.plan || 'free';
    const hasKey = !!localStorage.getItem('userApiKey');

    if (plan === 'free') {
      message.warning('O Tutor de IA está disponível nos planos Practice e Fluent.', 4);
      router.push('/pricing');
      return;
    }

    if (!hasKey && (plan === 'practice' || plan === 'fluent')) {
      const used = getTutorTimeUsedToday();
      if (used >= TUTOR_DAILY_LIMIT_MS) {
        const remaining = Math.ceil((TUTOR_DAILY_LIMIT_MS - used) / 60000);
        message.warning(`Você atingiu o limite de 30 min/dia do Tutor. Volte amanhã ou adicione uma API key para uso ilimitado.`, 5);
        return;
      }
    }

    if (mode.value === 'lesson' && !topic.value) {
      message.warning('Selecione um tópico para a lição.', 3);
      return;
    }

    sessionStartTime = Date.now();
    stage.value = 'session';
    history.value = [];
    tutorMessage.value = '';
    isLoading.value = true;

    // Primeira mensagem do tutor — sem áudio
    await sendMessage(null);
  }

  async function sendMessage(audio: Blob | null) {
    isLoading.value = true;
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;
    questionReady.value = false;

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

      form.append('level', level.value);
      form.append('mode', mode.value);
      form.append('topic', topic.value);
      form.append('history', JSON.stringify(history.value));

      const key = localStorage.getItem('userApiKey');
      if (key) form.append('userApiKey', key);

      const model = localStorage.getItem('userModel');
      if (model) form.append('userModel', model);

      const data = await tutorStore.sendMessage(form);

      history.value = data.history;
      tutorMessage.value = data.tutor_response;
      tutorName.value = data.tutor_name;
      isLoading.value = false;
      speakTutor(data.tutor_response_clean || data.tutor_response);
    } catch (err: any) {
      message.error(err.message || 'Erro de comunicação.', 5);
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
    await sendMessage(audioBlob.value);
  }

  function reRecord() {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioBlob.value = null;
    audioUrl.value = null;
    hasRecorded.value = false;
  }

  function endSession() {
    if (sessionStartTime) {
      addTutorTime(Date.now() - sessionStartTime);
      sessionStartTime = null;
    }
    stage.value = 'intro';
    history.value = [];
    tutorMessage.value = '';
    audioBlob.value = null;
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
    hasRecorded.value = false;
    isSpeaking.value = false;
    questionReady.value = false;
    window.speechSynthesis.cancel();
  }

  onMounted(() => {
    const saved = localStorage.getItem('userModel');
    if (saved) {
      activeModel.value = saved;
      activeModelLabel.value = modelLabels[saved] || saved;
    }
  });

  onUnmounted(() => {
    if (sessionStartTime) {
      addTutorTime(Date.now() - sessionStartTime);
      sessionStartTime = null;
    }
    window.speechSynthesis.cancel();
    if (speakTimer) clearTimeout(speakTimer);
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  });
</script>

<template>
  <div class="tutor-container">
    <!-- INTRO -->
    <div v-if="stage === 'intro'" class="tutor-card">
      <img :src="aceWaving" alt="Ace" class="ace" />
      <h1>Tutor de Inglês</h1>

      <div class="tutor-info">
        <span class="tutor-flag">{{ tutorInfo.flag }}</span>
        <div>
          <p class="tutor-name">{{ tutorInfo.name }}</p>
          <p class="tutor-desc">{{ tutorInfo.description }}</p>
        </div>
      </div>

      <p class="level-badge">
        Nível: <strong>{{ level }}</strong>
      </p>

      <!-- Modo -->
      <div class="mode-select">
        <button
          class="mode-btn"
          :class="{ active: mode === 'free' }"
          @click="mode = 'free'"
        >
          💬 Conversa livre
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'lesson' }"
          @click="mode = 'lesson'"
        >
          📚 Lição estruturada
        </button>
      </div>

      <!-- Tópico da lição -->
      <div v-if="mode === 'lesson'" class="topic-select">
        <p class="topic-label">Escolha o tópico:</p>
        <select v-model="topic" class="select">
          <option value="" disabled>Selecione um tópico</option>
          <option v-for="t in lessonTopics" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="model-badge" :class="activeModel ? 'model-custom' : 'model-default'">
        <span v-if="!activeModel">🤖 Claude Haiku — incluso no plano</span>
        <span v-else>🔑 {{ activeModelLabel }} — usando sua API key</span>
      </div>

      <button class="btn-blue" @click="startSession">
        {{ mode === 'free' ? '💬 Iniciar conversa' : '📚 Iniciar lição' }}
      </button>
      <button class="btn-ghost" @click="router.push('/settings')">
        Mudar nível nas configurações
      </button>
      <button class="btn-ghost" @click="router.push('/')">Voltar</button>
    </div>

    <!-- SESSION -->
    <div v-else-if="stage === 'session'" class="tutor-card">
      <div class="session-header">
        <div class="tutor-info-small">
          <span>{{ tutorInfo.flag }}</span>
          <span class="tutor-name-small">{{
            tutorName || tutorInfo.name
          }}</span>
          <span class="mode-tag">{{
            mode === 'free' ? '💬 Livre' : '📚 Lição'
          }}</span>
          <span v-if="topic" class="topic-tag">{{ topic }}</span>
        </div>
        <button class="btn-end" @click="endSession">✕ Encerrar</button>
      </div>

      <img
        :src="aceImage"
        alt="Ace"
        class="ace"
        :class="{ speaking: isSpeaking }"
      />

      <!-- Loading -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>{{ tutorInfo.name }} está pensando...</span>
      </div>

      <!-- Mensagem do tutor -->
      <div v-if="!isLoading && tutorMessage" class="message-box">
        <p>{{ tutorMessage }}</p>
        <button
          class="btn-listen"
          :class="{ 'btn-listen-pulse': questionReady }"
          @click="speakText(tutorMessage)"
        >
          🔊 {{ questionReady ? 'Toque para ouvir' : 'Ouvir novamente' }}
        </button>
      </div>

      <!-- Histórico resumido -->
      <div v-if="history.length > 2" class="history-hint">
        <p>{{ history.length / 2 }} trocas na sessão</p>
      </div>

      <!-- Controles -->
      <div v-if="!isLoading" class="controls">
        <button
          v-if="!isRecording && !hasRecorded"
          class="btn-green"
          @click="startRecording"
        >
          🎤 Responder
        </button>
        <button v-if="isRecording" class="btn-red" @click="stopRecording">
          ⏹️ Parar
        </button>
        <div v-if="hasRecorded && !isRecording" class="recorded-wrap">
          <audio
            v-if="audioUrl"
            :src="audioUrl"
            controls
            class="audio-player"
          ></audio>
          <button class="btn-blue" @click="submitAnswer">📤 Enviar</button>
          <button class="btn-ghost" @click="reRecord">🔄 Regravar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tutor-container {
    max-width: 560px;
    margin: 0 auto;
    padding: 24px 16px 80px;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .tutor-card {
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
  .tutor-info {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 12px 16px;
    width: 100%;
  }
  .tutor-flag {
    font-size: 28px;
  }
  .tutor-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  .tutor-desc {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }
  .level-badge {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }
  .mode-select {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .mode-btn {
    flex: 1;
    padding: 12px;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mode-btn.active {
    border-color: var(--accent);
    background: var(--accent);
    color: white;
  }
  .topic-select {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .topic-label {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    align-self: flex-start;
  }
  .select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    background: var(--card-bg);
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
  }
  .session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
  }
  .tutor-info-small {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tutor-name-small {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .mode-tag {
    font-size: 11px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 2px 8px;
    border-radius: 10px;
  }
  .topic-tag {
    font-size: 11px;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 2px 8px;
    border-radius: 10px;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn-end {
    padding: 6px 12px;
    background: transparent;
    color: var(--text-tertiary);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-end:hover {
    background: var(--bg-secondary);
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
  .message-box {
    background: var(--bg-secondary);
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 14px 18px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .message-box p {
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.6;
    font-weight: 500;
    margin: 0;
  }
  .btn-listen {
    background: none;
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    align-self: flex-start;
    transition: all 0.2s;
  }
  .btn-listen:hover {
    background: var(--bg-secondary);
  }
  .btn-listen-pulse {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
    animation: attention 1s ease-in-out infinite alternate;
  }
  @keyframes attention {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.03);
    }
  }
  .history-hint {
    font-size: 12px;
    color: var(--text-tertiary);
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
</style>
