<script lang="ts">
export default { name: 'SpeakingAvatar' };
</script>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const aceThinking = new URL('../../assets/ace/ace-thinking.png', import.meta.url).href;
const aceMicrophone = new URL('../../assets/ace/ace-microphone.png', import.meta.url).href;

const props = defineProps<{
  text: string;
  autoSpeak?: boolean;
  lang?: string;
}>();

const isSpeaking = ref(false);
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

function speak() {
  if (speakTimer) clearTimeout(speakTimer);
  window.speechSynthesis.cancel();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return;

  try {
    const clean = cleanTextForSpeech(props.text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = props.lang || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 1;

    utterance.onstart = () => { isSpeaking.value = true; };
    utterance.onend = () => { isSpeaking.value = false; };
    utterance.onerror = () => { isSpeaking.value = false; };

    window.speechSynthesis.speak(utterance);
    speakTimer = setTimeout(() => { isSpeaking.value = false; }, 30000);
  } catch {
    isSpeaking.value = false;
  }
}

watch(() => props.text, (newText) => {
  if (props.autoSpeak && newText) speak();
});

onUnmounted(() => {
  window.speechSynthesis.cancel();
  if (speakTimer) clearTimeout(speakTimer);
});

defineExpose({ speak, isSpeaking });
</script>

<template>
  <div class="speaking-avatar">
    <img
      :src="isSpeaking ? aceMicrophone : aceThinking"
      alt="Ace"
      class="ace"
      :class="{ speaking: isSpeaking }"
    />
    <button v-if="!isSpeaking && text" class="btn-listen" @click="speak">
      🔊 Ouvir novamente
    </button>
  </div>
</template>

<style scoped>
.speaking-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.ace {
  width: 90px;
  height: auto;
}
.ace.speaking {
  animation: pulse 0.6s ease-in-out infinite alternate;
}
@keyframes pulse {
  from { transform: scale(1.04); }
  to { transform: scale(1.1); }
}
.btn-listen {
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
</style>
