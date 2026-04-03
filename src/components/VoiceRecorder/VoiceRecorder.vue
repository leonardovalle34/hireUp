<script lang="ts">
  export default {
    name: 'VoiceRecorder',
  };
</script>

<script lang="ts" setup>
  import { onMounted, ref, watch, nextTick } from 'vue';

  const props = defineProps<{
    modelValue?: string;
  }>();

  const emit = defineEmits(['update:modelValue']);

  const recording = ref(false);
  const transcript = ref(props.modelValue || '');
  const transcriptCard = ref<any | null>(null);

  let recognition: any = null;
  let lastText = '';
  let silenceTimer: any = null;

  // 🔥 sync com o pai
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== transcript.value) {
        transcript.value = newValue ?? '';
        scrollToBottom();
      }
    },
  );

  // 🔥 sempre envia pro pai
  watch(transcript, (val) => {
    emit('update:modelValue', val);
    scrollToBottom();
  });

  const scrollToBottom = () => {
    nextTick(() => {
      const cardElement: any = transcriptCard.value?.$el;
      if (cardElement) {
        cardElement.scrollTop = cardElement.scrollHeight;
      }
    });
  };

  onMounted(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = 'en-US';

    // 🔥 ESSENCIAL (remove duplicação)
    recognition.interimResults = false;

    // 🔥 melhor no Android
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.trim();

      // 🔥 evita duplicação
      if (text && text !== lastText) {
        transcript.value += text + ' ';
        lastText = text;
      }
    };

    recognition.onend = () => {
      if (!recording.value) return;

      // 🔥 restart automático (respiração)
      setTimeout(() => {
        startListening();
      }, 300);
    };

    recognition.onerror = () => {
      if (recording.value) {
        setTimeout(startListening, 500);
      }
    };
  });

  function startListening() {
    try {
      recognition.start();

      // 🔥 fallback anti-travamento
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 6000);
    } catch {}
  }

  function startRecording() {
    transcript.value = '';
    lastText = '';
    recording.value = true;

    startListening();
  }

  function stopRecording() {
    recording.value = false;

    try {
      recognition.stop();
    } catch {}
  }
</script>

<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <a-button
        type="primary"
        v-if="!recording"
        @click="startRecording"
        style="width: 100%"
      >
        🎤 Start Answer
      </a-button>

      <a-button
        danger
        v-if="recording"
        @click="stopRecording"
        style="width: 100%"
      >
        Stop
      </a-button>

      <a-card
        v-if="transcript"
        class="voice-record-transcript"
        ref="transcriptCard"
      >
        <p>{{ transcript }}</p>
      </a-card>
    </a-space>
  </div>
</template>

<style scoped>
  .voice-record-transcript {
    max-height: 100px;
    overflow: auto;
  }
</style>
