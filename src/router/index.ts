import { createRouter, createWebHistory } from 'vue-router';
// Fix for TypeScript: Property 'env' does not exist on type 'ImportMeta'.
// Vite provides import.meta.env, so declare types if missing.
declare global {
  interface ImportMetaEnv {
    readonly BASE_URL: string;
    // add other env variables here if needed
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import { useAuthStore } from '@/stores/auth';
import PricingView from '@/views/PricingView.vue';

import LessonView from '@/views/LessonView.vue';
import AppLayout from '@/layouts/AppLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: LoginView },

    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', component: DashboardView },
        { path: 'lessons', component: LessonView },
        { path: 'pricing', component: PricingView },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if(!auth.user) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.user) {
    return '/login';
  }

  if (auth.user && to.path === '/login') {
    return '/';
  }
});

export default router;
