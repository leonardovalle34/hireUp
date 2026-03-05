import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/login', component: LoginView },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.fetchUser()

  if (!auth.user && to.path !== '/login') {
    return '/login'
  }

  if (auth.user && to.path === '/login') {
    return '/'
  }
})

export default router
