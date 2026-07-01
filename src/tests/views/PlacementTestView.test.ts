import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import PlacementTestView from '@/views/PlacementTestView.vue';
import { callPlacementTest } from '@/services/placementTest';

vi.mock('@/services/placementTest', () => ({ callPlacementTest: vi.fn() }));

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

let mockDashboardUser: any = null;
const mockFetchUser = vi.fn().mockResolvedValue(undefined);
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get dashboardUser() {
      return mockDashboardUser;
    },
    fetchUser: mockFetchUser,
  }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
    ],
  });
}

async function mountPlacementTestView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(PlacementTestView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, router };
}

async function answerQuiz(wrapper: any, key: string) {
  const optionBtn = wrapper.findAll('.option-btn').find((b: any) => b.find('.opt-key').text() === key)!;
  await optionBtn.trigger('click');
  await wrapper.find('.btn-primary').trigger('click'); // "Confirmar" button
  await flushPromises();
}

async function recordAndSubmit(wrapper: any) {
  await wrapper.find('.btn-green').trigger('click'); // "Gravar" button
  await flushPromises();
  await wrapper.find('.btn-red').trigger('click'); // "Parar" button
  await flushPromises();
  const submitBtn = wrapper.findAll('button').find((b: any) => b.text().includes('Enviar'))!;
  await submitBtn.trigger('click');
  await flushPromises();
}

function mockServiceByStage() {
  vi.mocked(callPlacementTest).mockImplementation(async (form: FormData) => {
    const stage = form.get('stage');
    if (stage === 'quiz') return { score: 20 } as any;
    if (stage === 'pronunciation') return { score: 15 } as any;
    if (stage === 'interpretation') return { score: 18 } as any;
    if (stage === 'conversation') {
      return { score: 12, ai_response: 'Great answer!', history: [{ role: 'user', content: 'hi' }] } as any;
    }
    if (stage === 'result') {
      return {
        level: 'intermediate',
        level_label: 'Intermediate',
        final_score: 65,
        breakdown: { quiz: 80, pronunciation: 60, interpretation: 70, conversation: 50 },
      } as any;
    }
    return {} as any;
  });
}

describe('PlacementTestView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDashboardUser = null;
    mockServiceByStage();
  });

  it('shows the blocked screen when a Free user has already taken the test', async () => {
    mockDashboardUser = { plan: 'free', placement_test_done: true };
    const { wrapper } = await mountPlacementTestView();

    expect(wrapper.find('.blocked-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Você já realizou o teste de nivelamento.');
  });

  it('allows starting the test when the user is not blocked', async () => {
    const { wrapper } = await mountPlacementTestView();

    expect(wrapper.find('h1').text()).toBe('Teste de Nivelamento');
    await wrapper.find('.btn-primary').trigger('click'); // "Começar o teste" button

    expect(wrapper.find('.stage-tag').text()).toContain('Gramática');
  });

  it('allows re-recording before submitting (resets hasRecorded)', async () => {
    const { wrapper } = await mountPlacementTestView();
    await wrapper.find('.btn-primary').trigger('click'); // welcome -> quiz
    for (let i = 0; i < 5; i++) {
      await answerQuiz(wrapper, 'A'); // 5 questions -> pronunciation
    }

    await wrapper.find('.btn-green').trigger('click');
    await flushPromises();
    await wrapper.find('.btn-red').trigger('click');
    await flushPromises();
    expect(wrapper.find('.audio-player').exists()).toBe(true);

    const rerecordBtn = wrapper.findAll('button').find((b) => b.text().includes('Regravar'))!;
    await rerecordBtn.trigger('click');

    expect(wrapper.find('.audio-player').exists()).toBe(false);
    expect(wrapper.find('.btn-green').exists()).toBe(true);
  });

  it('completes the whole flow: quiz → pronunciation → interpretation → conversation → result', async () => {
    const { wrapper, router } = await mountPlacementTestView();

    // WELCOME -> QUIZ
    await wrapper.find('.btn-primary').trigger('click');
    expect(wrapper.find('.stage-tag').text()).toContain('Gramática — 1/5');

    // 5 grammar questions
    for (let i = 0; i < 5; i++) {
      await answerQuiz(wrapper, 'A');
    }

    // PRONUNCIATION — 3 phrases
    expect(wrapper.find('.stage-tag').text()).toContain('Pronúncia — 1/3');
    for (let i = 0; i < 3; i++) {
      await recordAndSubmit(wrapper);
    }

    // INTERPRETATION — text on the first question, then 2 questions by voice
    expect(wrapper.find('.stage-tag').text()).toContain('Interpretação — 1/2');
    expect(wrapper.find('.interp-text').exists()).toBe(true);
    await wrapper.find('.btn-primary').trigger('click'); // "Já li, responder →"
    await recordAndSubmit(wrapper);

    expect(wrapper.find('.stage-tag').text()).toContain('Interpretação — 2/2');
    expect(wrapper.find('.interp-text').exists()).toBe(false); // only shown on the 1st question
    await recordAndSubmit(wrapper);

    // CONVERSATION — starts automatically and takes 3 turns
    await flushPromises();
    expect(wrapper.find('.stage-tag').text()).toContain('Conversação');
    expect(wrapper.text()).toContain('Great answer!');
    for (let i = 0; i < 3; i++) {
      await recordAndSubmit(wrapper);
    }

    // RESULT
    await flushPromises();
    expect(wrapper.find('h1').text()).toBe('Seu nível é:');
    expect(wrapper.find('.level-badge').text()).toBe('Intermediate');
    expect(wrapper.find('.score-total').text()).toContain('65/100');
    expect(mockFetchUser).toHaveBeenCalled();

    await wrapper.find('.btn-primary').trigger('click'); // "Ir para o Dashboard" button
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('shows an error and keeps the flow going when the service fails at one stage', async () => {
    vi.mocked(callPlacementTest).mockRejectedValueOnce(new Error('Falha ao enviar resposta'));
    const { message } = await import('ant-design-vue');

    const { wrapper } = await mountPlacementTestView();
    await wrapper.find('.btn-primary').trigger('click'); // -> quiz
    await answerQuiz(wrapper, 'A'); // 1st question fails

    expect(message.error).toHaveBeenCalledWith('Falha ao enviar resposta', 4);
    // The flow keeps going even on error (finally always advances)
    expect(wrapper.find('.stage-tag').text()).toContain('Gramática — 2/5');
  });
});
