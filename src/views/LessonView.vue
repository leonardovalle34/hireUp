<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useLessonStore } from '@/stores/lesson';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder.vue';

  const lessonStore = useLessonStore();
  const router = useRouter();
  const answer = ref('');

  const { submitLoading, feedback, lesson, loading } = storeToRefs(lessonStore);

  const submit = async () => {
    await lessonStore.submitAnswer(answer.value);
    answer.value = '';
  };

  onMounted(async () => {
    const canStart = await lessonStore.canStartLesson();
    if (!canStart) {
      router.push('pricing');
      return;
    }
    await lessonStore.fetchLesson();
    await lessonStore.startLesson();
  });
</script>

<template>
  <div class="lessons">
    <h1>Daily Interview Practice</h1>

    <div v-if="loading || submitLoading">Loading lesson...</div>

    <div v-else>
      <a-card v-if="feedback === null">
        <h2>{{ lesson?.question }}</h2>

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
</template>

<style scoped>
  .lessons {
    max-width: 800px;
    margin: auto;
    padding: 40px;
  }
</style>
