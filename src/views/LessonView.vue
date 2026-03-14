<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Lesson {
  id: number
  title: string
  date: string
}

const lessons = ref<Lesson[]>([])

onMounted(() => {
  lessons.value = [
    {
      id: 1,
      title: 'Present Simple',
      date: '2026-03-10',
    },
    {
      id: 2,
      title: 'Past Simple',
      date: '2026-03-12',
    },
  ]
})
</script>

<template>
  <div class="lessons">
    <h1>My Lessons</h1>

    <a-list bordered :data-source="lessons">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta :title="item.title" :description="item.date" />
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<style scoped>
.lessons {
  max-width: 800px;
  margin: auto;
  padding: 40px;
}
</style>
