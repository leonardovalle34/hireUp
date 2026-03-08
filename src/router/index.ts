import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import PricingView from '@/views/PricingView.vue'
import LessonView from '@/views/LessonView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/login', component: LoginView },
    {
      path: '/lessons',
      component: LessonView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pricing',
      component: PricingView,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.user) {
    return '/login'
  }

  if (auth.user && to.path === '/login') {
    return '/'
  }
})

export default router
