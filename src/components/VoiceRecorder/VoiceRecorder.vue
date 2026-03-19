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
  const finalTranscript = ref('');

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

  recognition = new (window as any).SpeechRecognition();

  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event: any) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptPart = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript.value += transcriptPart + ' ';
      } else {
        interim += transcriptPart;
      }
    }

    transcript.value = finalTranscript.value + interim;

    emit('update:modelValue', transcript.value);
  };

  function startRecording() {
    if (!recognition) return;
    transcript.value = '';
    finalTranscript.value = '';
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

      <a-card v-if="transcript">
        <p>{{ transcript }}</p>
      </a-card>
    </a-space>
  </div>
</template>
