<script lang="ts">
  export default {
    name: 'VoiceRecorder',
  };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';

  interface Emit {
    (event: 'audio-recorded', audioBlob: Blob): void;
  }

  const recording = ref(false);
  const audioUrl = ref<string | null>(null);
  const audioBlob = ref<Blob | null>(null);

  const emit = defineEmits<Emit>();

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        audioBlob.value = blob;

        audioUrl.value = URL.createObjectURL(blob);
      };

      mediaRecorder.start();
      recording.value = true;
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
    }
  }

  // 🛑 STOP
  function stopRecording() {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    recording.value = false;
  }

  // 📤 SUBMIT
  async function submitAudio() {
    if (!audioBlob.value) return;

    const formData = new FormData();
    formData.append('file', audioBlob.value, 'recording.webm');

    emit('audio-recorded', audioBlob.value);
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
        🎤 Start Recording
      </a-button>

      <a-button
        danger
        v-if="recording"
        @click="stopRecording"
        style="width: 100%"
      >
        ⏹️ Stop
      </a-button>

      <audio
        v-if="audioUrl"
        :src="audioUrl"
        controls
        style="width: 100%"
      ></audio>

      <!-- 📤 Submit -->
      <a-button
        type="primary"
        v-if="audioBlob"
        @click="submitAudio"
        style="width: 100%"
      >
        📤 Submit Answer
      </a-button>
    </a-space>
  </div>
</template>
