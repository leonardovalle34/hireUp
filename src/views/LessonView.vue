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
  import { useAuthStore } from '@/stores/auth';

  const lessonStore = useLessonStore();
  const router = useRouter();
  const answer = ref('');
  const noAnswerAlert = ref<string | null>(null);
  const isSpeaking = ref(false);
  const auth = storeToRefs(useAuthStore());

  const { submitLoading, feedback, lesson, loading } = storeToRefs(lessonStore);
  const { user } = auth;

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
    isSpeaking.value = true;
  };

  const newQuestion = () => {
    isSpeaking.value = false;
    noAnswerAlert.value = null;
    feedback.value = null;
    getQuestions();
  };

  const getQuestions = async () => {
    const canStart = await lessonStore.canStartLesson();
    if (!canStart) {
      router.push('pricing');
      return;
    }
    if (user.value) {
      const storedSubject = localStorage.getItem('subject') || 'behavioral';
      const storedLevel = localStorage.getItem('level') || 'junior';
      await lessonStore.fetchLesson({
        userId: Number(user.value.id),
        focus: storedSubject,
        level: storedLevel,
      });
      await lessonStore.startLesson();
      if (lesson.value) {
        askQuestion();
      }
    } else {
      router.push('/login');
    }
  };

  onMounted(async () => {
    await getQuestions();
  });
</script>

<template>
  <div class="lessons">
    <h1>Daily Interview Practice</h1>

    <Loading v-if="loading || submitLoading" />

    <div v-else>
      <a-card v-if="feedback === null">
        <h2>{{ lesson && lesson.length > 0 ? lesson[0].question : '' }}</h2>
        <SpeakingAvatar
          :isSpeaking="isSpeaking"
          :question="
            lesson && lesson.length > 0 ? (lesson[0].question ?? '') : ''
          "
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
        <a-button
          type="primary"
          block
          style="margin-top: 20px"
          @click="newQuestion"
        >
          Next Question
        </a-button>
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
