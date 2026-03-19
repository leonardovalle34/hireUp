<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useLessonStore } from '@/stores/lesson';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder.vue';
  import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
  import SpeakingAvatar from '@/components/SpeakingAvatar/SpeakingAvatar.vue';
  import Loading from '@/components/Loading/Loading.vue';
  import AlertComponent from '@/components/AlertComponent/AlertComponent.vue';

  const lessonStore = useLessonStore();
  const router = useRouter();
  const answer = ref('');
  const noAnswerAlert = ref<string | null>(null);
  const isSpeaking = ref(false);

  const { submitLoading, feedback, lesson, loading } = storeToRefs(lessonStore);

  const submit = async () => {
    if (!answer.value.trim()) {
      noAnswerAlert.value = 'Please provide an answer before submitting.';
      setTimeout(() => {
        noAnswerAlert.value = null;
      }, 2000);
      return;
    }
    await lessonStore.submitAnswer(answer.value);
    answer.value = '';
  };

  const askQuestion = () => {
    console.log('passei aqui');
    isSpeaking.value = true;
  };

  onMounted(async () => {
    /*const canStart = await lessonStore.canStartLesson();
    if (!canStart) {
      router.push('pricing');
      return;
    }*/
    await lessonStore.fetchLesson();
    await lessonStore.startLesson();
    if (lesson.value) {
      askQuestion();
    }
  });
</script>

<template>
  <div class="lessons">
    <h1>Daily Interview Practice</h1>

    <Loading v-if="loading || submitLoading" />

    <div v-else>
      <a-card v-if="feedback === null">
        <h2>{{ lesson?.question }}</h2>
        <SpeakingAvatar
          :isSpeaking="isSpeaking"
          :question="lesson?.question ?? ''"
        />

        <VoiceRecorder
          :modelValue="answer"
          @update:modelValue="answer = $event"
        />

        <a-button type="primary" block style="margin-top: 20px" @click="submit">
          Submit Answer
        </a-button>
      </a-card>
      <a-card v-else>
        <h2>Feedback</h2>
        <p>Score: {{ feedback.score }}</p>
        <p>{{ feedback.feedback }}</p>
      </a-card>
    </div>
  </div>
  <AlertComponent
    v-if="noAnswerAlert"
    :message="noAnswerAlert"
    type="error"
    :show-icon="true"
  >
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
  </AlertComponent>
</template>

<style scoped>
  .lessons {
    max-width: 800px;
    margin: auto;
    padding: 40px;
  }
  h1,
  h2 {
    text-align: center;
    margin-bottom: 1rem;
  }
</style>
