import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { canUserTakeLesson, getLesson, createLessonSession, saveAnswer } from '@/services/lesson'

export const useLessonStore = defineStore('lesson', {
  state: () => ({
    lesson: null as any,
    loading: false as boolean,
    error: null as any,
  }),

  actions: {
    async canStartLesson() {
      const auth = useAuthStore()
      return await canUserTakeLesson(auth.user.id)
    },

    async fetchLesson() {
      this.loading = true
      try {
        this.lesson = await getLesson()
      } catch (err: any) {
        this.error = err.message
      }
      this.loading = false
    },

    async startLesson() {
      const auth = useAuthStore()
      return await createLessonSession(auth.user.id, this.lesson.id)
    },

    async submitAnswer(sessionId: string, answer: string) {
      const auth = useAuthStore()
      await saveAnswer(auth.user.id, this.lesson.id, sessionId, answer)
    },
  },
})
