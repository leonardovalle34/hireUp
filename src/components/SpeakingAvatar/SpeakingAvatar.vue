<script lang="ts">
  export default {
    name: 'SpeakingAvatar',
  };
</script>
<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { RedoOutlined } from '@ant-design/icons-vue';

  const Props = defineProps<{
    isSpeaking: boolean;
    question: string;
  }>();

  const isSpeaking = ref(false);

  const speak = (text: string) => {
    if (isSpeaking.value) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      isSpeaking.value = true;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
    };

    speechSynthesis.speak(utterance);
  };

  watch(
    () => Props.isSpeaking,
    (newVal) => {
      if (newVal) {
        speak(Props.question);
      }
    },
  );
</script>
<template>
  <div class="avatar-container">
    <img
      src="/avatar.png"
      alt="Avatar"
      class="avatar"
      :class="{ speaking: isSpeaking }"
    />
    <a-button
      type="primary"
      @click="speak(Props.question)"
      style="width: 20px"
      v-if="!isSpeaking"
    >
      <div
        style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <RedoOutlined />
      </div>
    </a-button>
  </div>
</template>
<style scoped>
  .avatar-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 100px;
    gap: 10px;
  }

  .avatar {
    width: 120px;
    transition: transform 0.3s ease;
  }

  .speaking {
    transform: scale(1.05);
  }
</style>
