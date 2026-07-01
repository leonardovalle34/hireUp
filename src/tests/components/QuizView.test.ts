import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import QuizView from '@/views/QuizView.vue';
import { useQuizStore } from '@/stores/quiz';
import {
  getNextQuestions,
  saveAnswer,
  incrementQuizUsage,
  getQuizUsageToday,
  getQuizDailyLimit,
} from '@/services/quiz';

vi.mock('@/services/quiz', () => ({
  getNextQuestions: vi.fn(),
  saveAnswer: vi.fn(),
  incrementQuizUsage: vi.fn(),
  getQuizUsageToday: vi.fn(),
  getQuizDailyLimit: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    dashboardUser: { plan: 'fluent' },
  }),
}));

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const testQuestions = [
  { id: 'q1', level: 'beginner', question: 'Pergunta 1?', options: ['a', 'b'], answer: 0, explanation: 'exp1', category: 'grammar' },
  { id: 'q2', level: 'beginner', question: 'Pergunta 2?', options: ['a', 'b'], answer: 1, explanation: 'exp2', category: 'grammar' },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/pricing', component: { template: '<div />' } },
    ],
  });
}

async function mountQuizView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(QuizView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  const quizStore = useQuizStore();
  return { wrapper, quizStore, router };
}

async function startQuiz(wrapper: VueWrapper) {
  const beginnerBtn = wrapper.findAll('.level-btn').find((b) => b.text() === 'Beginner');
  await beginnerBtn!.trigger('click');
  await flushPromises();
}

describe('QuizView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getQuizDailyLimit).mockReturnValue(null); // fluent plan = unlimited
    vi.mocked(getQuizUsageToday).mockResolvedValue(0);
    vi.mocked(saveAnswer).mockResolvedValue(undefined);
    vi.mocked(incrementQuizUsage).mockResolvedValue(undefined);
  });

  it('intro screen renders the 5 levels', async () => {
    const { wrapper } = await mountQuizView();

    const levelButtons = wrapper.findAll('.level-btn');
    expect(levelButtons).toHaveLength(5);
    ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Business'].forEach((label) => {
      expect(wrapper.text()).toContain(label);
    });
  });

  it('selecting a level and starting changes to the quiz stage', async () => {
    vi.mocked(getNextQuestions).mockResolvedValue(testQuestions as any);
    const { wrapper } = await mountQuizView();

    await startQuiz(wrapper);

    expect(wrapper.find('.level-grid').exists()).toBe(false);
    expect(wrapper.find('.question-text').exists()).toBe(true);
    expect(wrapper.find('.question-text').text()).toBe('Pergunta 1?');
  });

  it('answering correctly increments the score', async () => {
    vi.mocked(getNextQuestions).mockResolvedValue(testQuestions as any);
    const { wrapper, quizStore } = await mountQuizView();
    await startQuiz(wrapper);

    expect(quizStore.score).toBe(0);

    const options = wrapper.findAll('.option-btn');
    await options[0].trigger('click'); // option "a", index 0 == correct answer for q1
    await flushPromises();

    expect(quizStore.score).toBe(1);
    expect(saveAnswer).toHaveBeenCalledWith('user-1', 'q1', true);
    expect(wrapper.find('.explanation-box').text()).toContain('Correto');
  });

  it('answering incorrectly does NOT increment the score', async () => {
    vi.mocked(getNextQuestions).mockResolvedValue(testQuestions as any);
    const { wrapper, quizStore } = await mountQuizView();
    await startQuiz(wrapper);

    const options = wrapper.findAll('.option-btn');
    await options[1].trigger('click'); // option "b", index 1 != correct answer for q1 (0)
    await flushPromises();

    expect(quizStore.score).toBe(0);
    expect(saveAnswer).toHaveBeenCalledWith('user-1', 'q1', false);
    expect(wrapper.find('.explanation-box').text()).toContain('Incorreto');
  });

  it('completing all questions changes to the result stage', async () => {
    vi.mocked(getNextQuestions).mockResolvedValue(testQuestions as any);
    const { wrapper } = await mountQuizView();
    await startQuiz(wrapper);

    // Question 1 (correct answer = index 0)
    await wrapper.findAll('.option-btn')[0].trigger('click');
    await flushPromises();
    await wrapper.find('.btn-blue').trigger('click');
    await flushPromises();

    // Question 2 (correct answer = index 1)
    await wrapper.findAll('.option-btn')[1].trigger('click');
    await flushPromises();
    await wrapper.find('.btn-blue').trigger('click');
    await flushPromises();

    expect(wrapper.find('.result-score').exists()).toBe(true);
    expect(wrapper.find('.result-score').text()).toBe('2/2');
  });
});
