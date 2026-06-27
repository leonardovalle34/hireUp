import { defineStore } from 'pinia';
import { sendTutorMessage, type TutorResponse } from '@/services/tutor';

export const useTutorStore = defineStore('tutor', {
  state: () => ({
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async sendMessage(form: FormData): Promise<TutorResponse> {
      this.loading = true;
      this.error = null;
      try {
        return await sendTutorMessage(form);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
