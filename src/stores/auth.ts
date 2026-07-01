import { defineStore } from 'pinia';
import router from '@/router';
import { signIn, signUp, signOut, getFullUser } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import type { IUser } from '@/interfaces/IUser';
import { deleteAccount } from '@/services/account';
import { updateEnglishLevel } from '@/services/profile';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any | null,
    dashboardUser: null as IUser | null,
    profile: null as any,
    loading: false,
    error: '',
  }),

  actions: {
    async fetchUser() {
      this.loading = true;
      try {
        const result = await getFullUser();

        if (!result) {
          this.user = null;
          this.dashboardUser = null;
          return;
        }

        this.user = result.user;
        this.dashboardUser = result.dashboard;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = '';

      try {
        await signIn(email, password);
        await this.fetchUser();
      } catch (err: any) {
        this.error = err.message;
      }

      this.loading = false;
    },

    async register(email: string, password: string, name: string) {
      this.loading = true;
      this.error = '';

      try {
        this.user = await signUp(email, password, name);
      } catch (err: any) {
        this.error = err.message;
      }

      this.loading = false;
    },

    async logout() {
      await signOut();
      this.user = null;
      this.profile = null;
      router.push('/login');
    },

    async deleteAccount() {
      this.loading = true;
      try {
        await deleteAccount();
        await signOut();
        this.user = null;
        this.dashboardUser = null;
        router.push('/login');
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    listenAuth() {
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null;

        if (!session?.user) {
          this.dashboardUser = null;
          this.profile = null;
        }
      });
    },

    async updateLevel(level: string) {
      this.loading = true;
      try {
        if (!this.user?.id) throw new Error('Usuário não autenticado');
        await updateEnglishLevel(this.user.id, level);
        if (this.dashboardUser) {
          // update locally without needing a refetch
          (this.dashboardUser as any).english_level = level;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
