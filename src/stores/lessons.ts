import { defineStore } from 'pinia';
import { getLessons, getUserProgress, completeLesson } from '@/services/lessons';
import type { Lesson, UserProgress } from '@/interfaces/ILesson';

export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    lessons: [] as Lesson[],
    progress: [] as UserProgress[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getProgress: (state) => (lessonId: string) =>
      state.progress.find(p => p.lesson_id === lessonId),

    completedCount: (state) =>
      state.progress.filter(p => p.completed).length,

    lessonsByLevel: (state) => (level: string) =>
      level === 'all' ? state.lessons : state.lessons.filter(l => l.level === level),
  },

  actions: {
    async fetchLessons() {
      this.loading = true;
      this.error = null;
      try {
        this.lessons = await getLessons();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchProgress(userId: string) {
      try {
        this.progress = await getUserProgress(userId);
      } catch (err: any) {
        this.error = err.message;
      }
    },

    async saveProgress(userId: string, lessonId: string, score: number) {
      await completeLesson(userId, lessonId, score);
      await this.fetchProgress(userId);
    },
  },
});
