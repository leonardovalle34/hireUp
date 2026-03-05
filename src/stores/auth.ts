import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    loading: false as boolean,
    error: '' as string,
  }),

  actions: {
    async fetchUser() {
      const { data } = await supabase.auth.getUser()
      this.user = data?.user
    },
    async signIn(email: string, password: string) {
      this.loading = true
      this.error = ''
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        this.error = error.message
      } else {
        this.user = data.user
      }
      this.loading = false
    },
    async signUp(email: string, password: string) {
      this.loading = true
      this.error = ''
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        this.error = error.message
      } else {
        this.user = data.user
      }
      this.loading = false
    },
    async logout() {
      await supabase.auth.signOut()
      this.user = null
    },
  },
})
