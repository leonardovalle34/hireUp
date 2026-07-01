import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import TutorView from '@/views/TutorView.vue';
import { getLessons } from '@/services/lessons';

// Tests the real `isLevelAvailable` function from TutorView.vue (index
// comparison in levelOrder) through the real localStorage-based blocking
// flow implemented in onMounted (tutorTopic saved by LessonsView/NewsView
// before navigating to the Tutor).

vi.mock('@/services/lessons', () => ({ getLessons: vi.fn() }));

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// TutorView reads the auth store via `storeToRefs(auth)`, which only
// recognizes `dashboardUser` correctly if it's already a ref/reactive value —
// so, unlike the mock used for PlacementTestView (direct read), here
// `dashboardUser` needs to be a real `ref()`.
const mockDashboardUser = ref<any>({ english_level: 'beginner' });
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    dashboardUser: mockDashboardUser,
  }),
}));

const mockLessons = [
  { id: '1', title: 'Advanced Business Negotiations', tutor_topic: 'Advanced Business Negotiations', level: 'advanced' },
  { id: '2', title: 'Intermediate Presentations', tutor_topic: 'Intermediate Presentations', level: 'intermediate' },
  { id: '3', title: 'Beginner Greetings', tutor_topic: 'Beginner Greetings', level: 'beginner' },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/tutor', component: TutorView }],
  });
}

async function mountTutorView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/tutor');
  await router.isReady();
  const wrapper = mount(TutorView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper };
}

describe('Tutor — Level-Based Blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getLessons).mockResolvedValue(mockLessons as any);
  });

  it('blocks a Beginner student from accessing an Advanced topic saved via localStorage', async () => {
    mockDashboardUser.value = { english_level: 'beginner' };
    localStorage.setItem('tutorTopic', 'Advanced Business Negotiations');

    const { wrapper } = await mountTutorView();

    expect(wrapper.find('.topic-select').exists()).toBe(false);
    expect(wrapper.find('.mode-btn.active').text()).toContain('Conversa livre');
  });

  it('allows a student to access a topic of the same level saved via localStorage', async () => {
    mockDashboardUser.value = { english_level: 'intermediate' };
    localStorage.setItem('tutorTopic', 'Intermediate Presentations');

    const { wrapper } = await mountTutorView();

    expect(wrapper.find('.topic-select').exists()).toBe(true);
    expect(wrapper.find('.mode-btn.active').text()).toContain('Lição estruturada');
  });

  it('allows an advanced student to review a lower-level topic saved via localStorage', async () => {
    mockDashboardUser.value = { english_level: 'advanced' };
    localStorage.setItem('tutorTopic', 'Beginner Greetings');

    const { wrapper } = await mountTutorView();

    expect(wrapper.find('.topic-select').exists()).toBe(true);
    expect(wrapper.find('.mode-btn.active').text()).toContain('Lição estruturada');
  });
});
