import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { canUserTakeLesson, getLesson, createLessonSession, saveAnswer } from '@/services/lesson'

export const useLessonStore = defineStore('lesson', {
  state: () => ({
    lesson: null as any,
    session: null as any,
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
      const session = await createLessonSession(auth.user.id, this.lesson.id)
      this.session = session
      return session
    },

    async submitAnswer( answer: string) {
      const auth = useAuthStore()
      const result = await saveAnswer(auth.user.id, this.lesson.id,  answer)

      console.log('Answer saved:', result)
      return result
    },
  },
})
