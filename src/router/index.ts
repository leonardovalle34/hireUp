import { createRouter, createWebHistory } from 'vue-router';

declare global {
  interface ImportMetaEnv {
    readonly BASE_URL: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import { useAuthStore } from '@/stores/auth';
import PricingView from '@/views/PricingView.vue';
import NewUserForm from '@/views/NewUserForm.vue';
import LessonView from '@/views/LessonView.vue';
import AppLayout from '@/layouts/AppLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/signup', component: NewUserForm },

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

  if (!auth.user) {
    await auth.fetchUser();
  }

  if (to.meta.requiresAuth && !auth.user) {
    return '/login';
  }

  if (auth.user && to.path === '/login') {
    return '/';
  }
});

export default router;
