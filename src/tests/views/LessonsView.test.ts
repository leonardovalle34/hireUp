import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import LessonsView from '@/views/LessonsView.vue';
import { getLessons } from '@/services/lessons';

vi.mock('@/services/lessons', () => ({
  getLessons: vi.fn(),
  getUserProgress: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

const mockLessons = [
  { id: '1', order_num: 1, level: 'beginner', title: 'Greetings', estimated_minutes: 10 },
  { id: '2', order_num: 2, level: 'intermediate', title: 'Negotiations', estimated_minutes: 15 },
  { id: '3', order_num: 3, level: 'beginner', title: 'Small Talk', estimated_minutes: 8 },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/lesson/:id', component: { template: '<div />' } },
    ],
  });
}

async function mountLessonsView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(LessonsView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('LessonsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLessons).mockResolvedValue(mockLessons as any);
  });

  it('loads lessons on mount and renders the grid', async () => {
    const { wrapper } = await mountLessonsView();

    expect(getLessons).toHaveBeenCalled();
    expect(wrapper.findAll('.lesson-card')).toHaveLength(3);
  });

  it('filters lessons by level when clicking the filter', async () => {
    const { wrapper } = await mountLessonsView();

    const beginnerFilter = wrapper.findAll('.filter-btn').find((b) => b.text() === 'Beginner')!;
    await beginnerFilter.trigger('click');

    expect(wrapper.findAll('.lesson-card')).toHaveLength(2);
    expect(beginnerFilter.classes()).toContain('active');
  });

  it('marks completed lessons with ✅ and shows the score', async () => {
    const { getUserProgress } = await import('@/services/lessons');
    vi.mocked(getUserProgress).mockResolvedValue([
      { lesson_id: '1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
    ] as any);

    const { wrapper } = await mountLessonsView();

    const firstCard = wrapper.findAll('.lesson-card')[0];
    expect(firstCard.classes()).toContain('completed');
    expect(firstCard.find('.check').exists()).toBe(true);
    expect(firstCard.find('.score').text()).toBe('5/5');
  });

  it('shows the completed lesson count in the header', async () => {
    const { getUserProgress } = await import('@/services/lessons');
    vi.mocked(getUserProgress).mockResolvedValue([
      { lesson_id: '1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
      { lesson_id: '2', completed: false, quiz_score: 2, quiz_attempts: 1, completed_at: null },
    ] as any);

    const { wrapper } = await mountLessonsView();

    expect(wrapper.find('.completed-count').text()).toContain('1/40');
  });

  it('navigates to /lesson/:id when clicking a card', async () => {
    const { wrapper, router } = await mountLessonsView();

    await wrapper.findAll('.lesson-card')[0].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/lesson/1');
  });
});
