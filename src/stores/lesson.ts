import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { canUserTakeLesson, getLesson, createLessonSession, saveAnswer } from '@/services/lesson'
import { IFeedback } from '@/interface/IFeedback'
import { ILesson } from '@/interface/ILesson'



export const useLessonStore = defineStore('lesson', {
  state: () => ({
    lesson: null as ILesson | null,
    feedback: null as IFeedback | null,
    session: null as any,
    loading: false as boolean,
    error: null as any,
    submitLoading: false as boolean,
  }),

  actions: {
    async canStartLesson() {
      const auth = useAuthStore()
      return await canUserTakeLesson(auth.user.id)
    },

    async fetchLesson() {
      this.loading = true
      this.lesson = await getLesson()
      this.loading = false
    },

    async startLesson() {
      const auth = useAuthStore()
      if (!this.lesson) {
        throw new Error('Lesson is not loaded')
      }
      // If lesson has no id property, throw a more descriptive error
      const lessonId = (this.lesson as any).id
      if (!lessonId) {
        throw new Error('Lesson id is missing')
      }
      const session = await createLessonSession(auth.user.id, lessonId)
      this.session = session
      return session
    },

    async submitAnswer( answer: string) {
      this.submitLoading = true
      const auth = useAuthStore()
      if (!this.lesson) {
        throw new Error('Lesson is not loaded')
      }
      // Cast lesson to any to access id property
      const lessonId = (this.lesson as any).id
      if (!lessonId) {
        throw new Error('Lesson id is missing')
      }
      const result = await saveAnswer(auth.user.id, lessonId, answer)
      this.feedback = result
      this.submitLoading = false
    },
  },
})
