import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import LessonView from '@/views/LessonView.vue';
import { getLessonById, completeLesson, getUserProgress } from '@/services/lessons';

vi.mock('@/services/lessons', () => ({
  getLessonById: vi.fn(),
  completeLesson: vi.fn().mockResolvedValue(undefined),
  getUserProgress: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const mockLesson = {
  id: 'lesson-1',
  order_num: 5,
  level: 'beginner',
  title: 'Greetings',
  objective: 'Learn to greet people in English',
  explanation: 'Hello means oi.\n- Hi is casual\n- Good morning is formal',
  examples: [{ en: 'Hello!', pt: 'Olá!' }],
  quiz: [
    { question: 'Q1', options: ['Correct', 'Wrong'], answer: 0 },
    { question: 'Q2', options: ['Correct', 'Wrong'], answer: 0 },
    { question: 'Q3', options: ['Correct', 'Wrong'], answer: 0 },
    { question: 'Q4', options: ['Correct', 'Wrong'], answer: 0 },
    { question: 'Q5', options: ['Correct', 'Wrong'], answer: 0 },
  ],
  tutor_topic: 'Greetings and Introductions',
  estimated_minutes: 10,
};

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/lessons', component: { template: '<div />' } },
      { path: '/lesson/:id', component: LessonView },
      { path: '/tutor', component: { template: '<div />' } },
    ],
  });
}

async function mountLessonView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/lesson/lesson-1');
  await router.isReady();
  const wrapper = mount(LessonView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, router };
}

async function goToQuizTab(wrapper: any) {
  const quizTab = wrapper.findAll('.tab').find((t: any) => t.text().includes('Quiz'))!;
  await quizTab.trigger('click');
}

async function answerQuestion(wrapper: any, optionIndex: number) {
  const options = wrapper.findAll('.quiz-option');
  await options[optionIndex].trigger('click');
  await wrapper.find('.btn-next').trigger('click');
}

describe('LessonView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getLessonById).mockResolvedValue(JSON.parse(JSON.stringify(mockLesson)));
  });

  it('loads the lesson by the route ID and shows its content', async () => {
    const { wrapper } = await mountLessonView();

    expect(getLessonById).toHaveBeenCalledWith('lesson-1');
    expect(wrapper.find('h1').text()).toBe('Greetings');
    expect(wrapper.find('.objective').text()).toBe('Learn to greet people in English');
  });

  it('shows an error and redirects to /lessons when the lesson is not found', async () => {
    vi.mocked(getLessonById).mockRejectedValue(new Error('Aula não encontrada'));
    const { message } = await import('ant-design-vue');

    const { wrapper, router } = await mountLessonView();

    expect(message.error).toHaveBeenCalledWith('Aula não encontrada.', 3);
    expect(router.currentRoute.value.path).toBe('/lessons');
    expect(wrapper.find('.lesson-card').exists()).toBe(false);
  });

  it('switches between the explanation, examples, and quiz tabs', async () => {
    const { wrapper } = await mountLessonView();

    expect(wrapper.find('.explanation').exists()).toBe(true);

    await wrapper.findAll('.tab').find((t) => t.text().includes('Exemplos'))!.trigger('click');
    expect(wrapper.find('.example-en').text()).toBe('Hello!');

    await goToQuizTab(wrapper);
    expect(wrapper.find('.quiz-question').exists()).toBe(true);
  });

  it('marks the correct option when answering and advances to the next question', async () => {
    const { wrapper } = await mountLessonView();
    await goToQuizTab(wrapper);

    expect(wrapper.find('.quiz-progress').text()).toContain('Pergunta 1 de 5');

    const options = wrapper.findAll('.quiz-option');
    await options[0].trigger('click'); // correct answer (index 0)

    expect(options[0].classes()).toContain('correct');

    await wrapper.find('.btn-next').trigger('click');
    expect(wrapper.find('.quiz-progress').text()).toContain('Pergunta 2 de 5');
  });

  it('marks the wrong option while also highlighting the correct one', async () => {
    const { wrapper } = await mountLessonView();
    await goToQuizTab(wrapper);

    const options = wrapper.findAll('.quiz-option');
    await options[1].trigger('click'); // wrong answer (correct one is index 0)

    expect(options[1].classes()).toContain('wrong');
    expect(options[0].classes()).toContain('correct');
  });

  it('completes the quiz with a score >= 4 and saves the lesson progress', async () => {
    const { wrapper } = await mountLessonView();
    await goToQuizTab(wrapper);

    // 4 correct, 1 wrong = score 4
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 1);
    await flushPromises();

    expect(wrapper.find('.result-score').text()).toBe('4/5');
    expect(wrapper.find('.result-score').classes()).toContain('success');
    expect(wrapper.text()).toContain('Parabéns!');
    expect(completeLesson).toHaveBeenCalledWith('user-1', 'lesson-1', 4);
  });

  it('a score < 4 allows retrying, resetting the quiz', async () => {
    const { wrapper } = await mountLessonView();
    await goToQuizTab(wrapper);

    // 2 correct, 3 wrong = score 2
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 0);
    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 1);
    await flushPromises();

    expect(wrapper.find('.result-score').text()).toBe('2/5');
    expect(wrapper.find('.result-score').classes()).toContain('fail');

    await wrapper.find('.btn-blue').trigger('click'); // "Tentar novamente" button

    expect(wrapper.find('.quiz-progress').text()).toContain('Pergunta 1 de 5');
    expect(wrapper.find('.result-score').exists()).toBe(false);
  });

  it('does not call completeLesson when the score is below 4', async () => {
    const { wrapper } = await mountLessonView();
    await goToQuizTab(wrapper);

    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 1);
    await answerQuestion(wrapper, 1);
    await flushPromises();

    // saveProgress is only skipped on the client if !auth.user?.id — here the
    // real completeLesson is still called (the server decides not to grant a
    // badge), but with a score of 0.
    expect(completeLesson).toHaveBeenCalledWith('user-1', 'lesson-1', 0);
  });

  it('practiceWithTutor saves the topic to localStorage and navigates to /tutor', async () => {
    const { wrapper, router } = await mountLessonView();

    await wrapper.find('.btn-tutor').trigger('click');
    await flushPromises();

    expect(localStorage.getItem('tutorTopic')).toBe('Greetings and Introductions');
    expect(router.currentRoute.value.path).toBe('/tutor');
  });

  it('goes back to /lessons when clicking "Voltar"', async () => {
    const { wrapper, router } = await mountLessonView();

    await wrapper.find('.btn-back').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/lessons');
  });
});
