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
  let audioCtxUnlocked = false;

  function unlockAudioContext() {
    if (audioCtxUnlocked) return;
    const ctx = new AudioContext();
    ctx.resume().then(() => {
      audioCtxUnlocked = true;
      ctx.close();
    });
  }

  function getSupportedMimeType(): string {
    const types = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
  }

  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = getSupportedMimeType();
        const options = mimeType ? { mimeType } : {};
        mediaRecorder = new MediaRecorder(stream, options);
        chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const type = mediaRecorder?.mimeType || 'audio/mp4';
          const blob = new Blob(chunks, { type });
          audioBlob.value = blob;
          audioUrl.value = URL.createObjectURL(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(250);
        recording.value = true;
      })
      .catch((err) => {
        alert('Error accessing microphone: ' + err.message);
      });
  }

  function stopRecording() {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    recording.value = false;
  }

  async function submitAudio() {
    if (!audioBlob.value) return;

    const formData = new FormData();
    formData.append('file', audioBlob.value);

    emit('audio-recorded', audioBlob.value);
  }
</script>

<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <a-button
        type="primary"
        v-if="!recording"
        @click="
          () => {
            unlockAudioContext();
            startRecording();
          }
        "
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
