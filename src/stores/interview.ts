import { defineStore } from 'pinia';
import {
  sendInterviewTurn,
  checkCanStartInterview,
} from '@/services/interview';

export const useInterviewStore = defineStore('interview', {
  state: () => ({
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async canStart(userId: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        return await checkCanStartInterview(userId);
      } catch (err: any) {
        this.error = err.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async sendTurn(form: FormData) {
      this.loading = true;
      this.error = null;
      try {
        return await sendInterviewTurn(form);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
