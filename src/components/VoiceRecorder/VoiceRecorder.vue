<script lang="ts">
  export default {
    name: 'VoiceRecorder',
  };
</script>

<script lang="ts" setup>
  import { ref, watch } from 'vue';

  const props = defineProps<{
    modelValue?: string;
  }>();

  const emit = defineEmits(['update:modelValue']);

  const recording = ref(false);
  const loading = ref(false);
  const transcript = ref(props.modelValue || '');

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  watch(
    () => props.modelValue,
    (val) => {
      if (val !== transcript.value) {
        transcript.value = val || '';
      }
    },
  );

  watch(transcript, (val) => {
    emit('update:modelValue', val);
  });

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await sendToServer(audioBlob);
    };

    mediaRecorder.start();
    recording.value = true;
  }

  function stopRecording() {
    mediaRecorder?.stop();
    recording.value = false;
  }

  async function sendToServer(audioBlob: Blob) {
    loading.value = true;

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const res = await fetch(
        'https://SEU_PROJECT.supabase.co/functions/v1/transcribe',
        {
          method: 'POST',
          body: formData,
        },
      );

      const data = await res.json();
      transcript.value = data.text;
    } catch (err) {
      console.error(err);
    }

    loading.value = false;
  }
</script>

<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <!-- BOTÃO -->
      <a-button
        type="primary"
        v-if="!recording"
        @click="startRecording"
        style="width: 100%"
      >
        🎤 Start Recording
      </a-button>

      <a-button
        danger
        v-if="recording"
        @click="stopRecording"
        style="width: 100%"
      >
        🔴 Stop Recording
      </a-button>

      <!-- STATUS -->
      <div style="text-align: center; font-weight: bold">
        <span v-if="recording">🎤 Recording...</span>
        <span v-else-if="loading">⏳ Transcribing...</span>
        <span v-else-if="transcript">✅ Done</span>
      </div>

      <!-- TRANSCRIPT -->
      <a-card v-if="transcript">
        <p>{{ transcript }}</p>
      </a-card>
    </a-space>
  </div>
</template>
