<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useLessonStore } from '@/stores/lesson';
  import { useRouter } from 'vue-router';
  import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder.vue';

  const lessonStore = useLessonStore();
  const router = useRouter();
  const answer = ref('');

  const submit = async () => {
    console.log('Submitting answer:', answer.value);
    answer.value =
      'Ah, this is a common issue when working with modern JavaScript features and build targets. Let me walk you through my diagnostic and resolution approach.First, Id identify that this is a target environment compatibility issue. The error tells us that top-level await is being used, but our build target (Chrome 87, Edge 88, etc.) doesnt support it. Top-level await was introduced in ES2022, so were dealing with a mismatch between our code and our browser support requirements.';
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

    <div v-if="lessonStore.loading">Loading lesson...</div>

    <div v-if="lessonStore.lesson">
      <a-card>
        <h2>{{ lessonStore.lesson.question }}</h2>

        <VoiceRecorder :modelValue="answer" @result="answer = $event" />

        <a-button type="primary" block style="margin-top: 20px" @click="submit">
          Submit Answer
        </a-button>
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
