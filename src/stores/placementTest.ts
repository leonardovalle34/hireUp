import { defineStore } from 'pinia';
import { callPlacementTest, type PlacementTestResponse } from '@/services/placementTest';

export const usePlacementTestStore = defineStore('placementTest', {
  state: () => ({
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async call(form: FormData): Promise<PlacementTestResponse> {
      this.loading = true;
      this.error = null;
      try {
        return await callPlacementTest(form);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
