<script lang="ts">
  export default {
    name: 'VoiceRecorder',
  };
</script>
<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';

  const props = defineProps<{
    modelValue?: string;
  }>();

  const emit = defineEmits(['update:modelValue']);
  const recording = ref(false);
  const transcript = ref('');

  let recognition: any = null;

  watch(
    () => props.modelValue,
    (newValue) => {
      transcript.value = newValue ?? '';
    },
  );

  onMounted(() => {
    const speechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!speechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
  });

  const SpeechRecognition: any =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event: any) => {
    let text = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    transcript.value = text;
    emit('update:modelValue', text);
  };

  function startRecording() {
    if (!recognition) return;

    transcript.value = '';
    recognition.start();
    recording.value = true;
  }

  function stopRecording() {
    if (!recognition) return;
    recognition.stop();
    recording.value = false;
  }
</script>
<template>
  <div class="voice-recorder">
    <a-space direction="vertical" style="width: 100%">
      <a-button type="primary" v-if="!recording" @click="startRecording">
        🎤 Start Answer
      </a-button>

      <a-button danger v-if="recording" @click="stopRecording"> Stop </a-button>

      <a-card v-if="transcript">
        <p>{{ transcript }}</p>
      </a-card>
    </a-space>
  </div>
</template>
