import { defineStore } from 'pinia'
import router from '@/router'
import { getCurrentUser, signIn, signUp, signOut, getProfile } from '@/services/auth'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    profile: null as any,
    loading: false,
    error: '',
  }),

  actions: {
    async fetchUser() {
      this.user = await getCurrentUser()

      if (this.user) {
        this.profile = await getProfile(this.user.id)
      }
    },

    async login(email: string, password: string) {
      this.loading = true
      this.error = ''

      try {
        this.user = await signIn(email, password)
        this.profile = await getProfile(this.user.id)
      } catch (err: any) {
        this.error = err.message
      }

      this.loading = false
    },

    async register(email: string, password: string) {
      this.loading = true
      this.error = ''

      try {
        this.user = await signUp(email, password)
      } catch (err: any) {
        this.error = err.message
      }

      this.loading = false
    },

    async logout() {
      await signOut()
      this.user = null
      this.profile = null
      router.push('/login')
    },

    async loadUser() {
      //TO-DO PUT SERVICE INTO SERVICE FILE
      this.loading = true
      const { data } = await supabase.auth.getUser()
      this.user = data?.user ?? null
      this.loading = false
    },

    listenAuth() {
      //TO-DO PUT SERVICE INTO SERVICE FILE
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
      })
    },
  },
})
