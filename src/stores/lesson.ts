import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { supabase } from '@/lib/supabase';
import {
  canUserTakeLesson,
  getLesson,
  createLessonSession,
  submitAudio,
} from '@/services/lesson';
import { IFeedback } from '@/interface/IFeedback';
import { ILesson } from '@/interface/ILesson';

export const useLessonStore = defineStore('lesson', {
  state: () => ({
    lesson: null as ILesson[] | null,
    feedback: null as IFeedback | null,
    session: null as any,
    loading: false as boolean,
    error: null as any,
    submitLoading: false as boolean,
  }),

  actions: {
    async canStartLesson() {
      const auth = useAuthStore();
      return await canUserTakeLesson(auth.user.id);
    },

    async fetchLesson({
      userId,
      focus,
      level,
    }: {
      userId: number;
      focus: string;
      level: string;
    }) {
      this.loading = true;
      this.lesson = await getLesson({ userId, focus, level });
      this.loading = false;
    },

    async startLesson() {
      const auth = useAuthStore();
      if (!this.lesson) {
        throw new Error('Lesson is not loaded');
      }
      // If lesson has no id property, throw a more descriptive error
      const lessonId = this.lesson[0].id;
      if (!lessonId) {
        throw new Error('Lesson id is missing');
      }
      const session = await createLessonSession(auth.user.id, lessonId);
      this.session = session;
      return session;
    },

    async submitAnswer(audioBlob: Blob) {
      this.submitLoading = true;

      if (!this.lesson) {
        throw new Error('Lesson is not loaded');
      }

      const lessonId = this.lesson[0].id;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('User is not authenticated');
      }

      const result = await submitAudio(audioBlob, lessonId, token);

      this.feedback = result;
      this.submitLoading = false;
    },
  },
});
