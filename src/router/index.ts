import { createRouter, createWebHistory } from 'vue-router';

declare global {
  interface ImportMetaEnv {
    VITE_GOOGLE_URL: string | undefined;
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
import InterviewView from '@/views/InterviewView.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import SupportView from '@/views/SupportView.vue';
import AboutView from '@/views/AboutView.vue';
import TutorView from '@/views/TutorView.vue';
import SettingsView from '@/views/SettingsView.vue';
import PlacementTestView from '@/views/PlacementTestView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/signup', component: NewUserForm },
    {
      path: '/auth/callback',
      component: () => import('@/views/AuthCallback.vue'),
      meta: { requiresAuth: false },
    },

    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', component: DashboardView },
        { path: 'interview', component: InterviewView },
        { path: 'pricing', component: PricingView },
        { path: 'support', component: SupportView },
        { path: 'about', component: AboutView },
        {
          path: '/tutor',
          component: TutorView,
        },
        {
          path: 'settings',
          component: SettingsView,
        },
        {
          path: 'placement-test',
          component: PlacementTestView,
        },
        {
          path: 'lessons',
          component: () => import('@/views/LessonsView.vue'),
        },
        {
          path: 'lesson/:id',
          component: () => import('@/views/LessonView.vue'),
        },
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
