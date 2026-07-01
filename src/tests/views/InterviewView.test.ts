import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import InterviewView from '@/views/InterviewView.vue';
import { sendInterviewTurn, checkCanStartInterview } from '@/services/interview';

vi.mock('@/services/interview', () => ({
  sendInterviewTurn: vi.fn(),
  checkCanStartInterview: vi.fn(),
}));

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const mockUser = ref<any>({ id: 'user-1' });
const mockDashboardUser = ref<any>({ plan: 'practice' });
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: mockUser,
    dashboardUser: mockDashboardUser,
  }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/pricing', component: { template: '<div />' } },
    ],
  });
}

async function mountInterviewView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(InterviewView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, router };
}

async function startInterviewFlow(wrapper: any) {
  await wrapper.find('.btn-blue').trigger('click');
  await flushPromises();
}

async function recordAndSubmit(wrapper: any) {
  await wrapper.find('.btn-green').trigger('click'); // "Gravar Resposta" button
  await flushPromises();
  await wrapper.find('.btn-red').trigger('click'); // "Parar Gravação" button
  await flushPromises();
  await wrapper.find('.recorded-wrap .btn-blue').trigger('click'); // "Enviar Resposta" button
  await flushPromises();
}

describe('InterviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUser.value = { id: 'user-1' };
    mockDashboardUser.value = { plan: 'practice' };
    vi.mocked(checkCanStartInterview).mockResolvedValue(true);
  });

  it('renders the intro screen', async () => {
    const { wrapper } = await mountInterviewView();

    expect(wrapper.find('h1').text()).toContain('Simulação de Entrevista');
    expect(wrapper.find('.btn-blue').text()).toContain('Iniciar Entrevista');
  });

  it('blocks starting when the Free plan has its own API key configured', async () => {
    mockDashboardUser.value = { plan: 'free' };
    localStorage.setItem('userApiKey', 'sk-minha-chave-12345');
    const { wrapper } = await mountInterviewView();

    await startInterviewFlow(wrapper);

    expect(wrapper.find('h1').text()).toContain('Simulação de Entrevista'); // stays on the intro screen
    expect(checkCanStartInterview).not.toHaveBeenCalled();
  });

  it('blocks starting when an external model was selected without an API key', async () => {
    localStorage.setItem('userModel', 'gpt-4o-mini');
    const { wrapper } = await mountInterviewView();

    await startInterviewFlow(wrapper);

    expect(wrapper.find('h1').text()).toContain('Simulação de Entrevista');
    expect(checkCanStartInterview).not.toHaveBeenCalled();
  });

  it('redirects to /pricing when the session limit has been reached (no API key)', async () => {
    vi.mocked(checkCanStartInterview).mockResolvedValue(false);
    const { wrapper, router } = await mountInterviewView();

    await startInterviewFlow(wrapper);

    expect(router.currentRoute.value.path).toBe('/pricing');
    expect(sendInterviewTurn).not.toHaveBeenCalled();
  });

  it('skips the limit check when the user has their own API key', async () => {
    localStorage.setItem('userApiKey', 'sk-minha-chave-12345');
    vi.mocked(sendInterviewTurn).mockResolvedValue({
      transcription: '',
      next_question: 'Tell me about yourself.',
      is_finished: false,
      feedback: null,
    });
    const { wrapper } = await mountInterviewView();

    await startInterviewFlow(wrapper);

    expect(checkCanStartInterview).not.toHaveBeenCalled();
    expect(wrapper.find('.question-box').text()).toContain('Tell me about yourself.');
  });

  it('starts the interview and shows the first question', async () => {
    vi.mocked(sendInterviewTurn).mockResolvedValue({
      transcription: '',
      next_question: 'Tell me about yourself.',
      is_finished: false,
      feedback: null,
    });
    const { wrapper } = await mountInterviewView();

    await startInterviewFlow(wrapper);

    expect(wrapper.find('.progress-label').text()).toContain('Pergunta 1 de 8');
    expect(wrapper.find('.question-box').text()).toContain('Tell me about yourself.');
  });

  it('records, submits the answer, and advances to the next question', async () => {
    vi.mocked(sendInterviewTurn)
      .mockResolvedValueOnce({
        transcription: '',
        next_question: 'Tell me about yourself.',
        is_finished: false,
        feedback: null,
      })
      .mockResolvedValueOnce({
        transcription: 'I am a software engineer.',
        next_question: 'What are your strengths?',
        is_finished: false,
        feedback: null,
      });
    const { wrapper } = await mountInterviewView();
    await startInterviewFlow(wrapper);

    await recordAndSubmit(wrapper);

    expect(wrapper.find('.progress-label').text()).toContain('Pergunta 2 de 8');
    expect(wrapper.find('.question-box').text()).toContain('What are your strengths?');
  });

  it('finishes the interview and shows the feedback when is_finished', async () => {
    vi.mocked(sendInterviewTurn)
      .mockResolvedValueOnce({
        transcription: '',
        next_question: 'Tell me about yourself.',
        is_finished: false,
        feedback: null,
      })
      .mockResolvedValueOnce({
        transcription: 'I am a software engineer.',
        next_question: null,
        is_finished: true,
        feedback: {
          score: 16,
          summary: 'Ótima entrevista!',
          strengths: ['Boa comunicação'],
          improvements: ['Mais exemplos práticos'],
          recommendation: 'Continue praticando.',
        },
      });
    const { wrapper } = await mountInterviewView();
    await startInterviewFlow(wrapper);

    await recordAndSubmit(wrapper);

    expect(wrapper.find('h1').text()).toContain('Entrevista Concluída!');
    expect(wrapper.find('.score-value').text()).toBe('16/20');
    expect(wrapper.find('.score-value').classes()).toContain('green');
    expect(wrapper.text()).toContain('Ótima entrevista!');
    expect(wrapper.text()).toContain('Boa comunicação');
  });

  it('shows a specific API key error when the server returns 401/403', async () => {
    vi.mocked(sendInterviewTurn).mockRejectedValue(new Error('Erro no servidor: 401'));
    const { wrapper } = await mountInterviewView();

    const { message } = await import('ant-design-vue');
    await startInterviewFlow(wrapper);

    expect(message.error).toHaveBeenCalledWith(
      expect.stringContaining('API key'),
      expect.any(Number),
    );
  });

  it('restartInterview goes back to the intro stage', async () => {
    vi.mocked(sendInterviewTurn)
      .mockResolvedValueOnce({
        transcription: '',
        next_question: 'Q1',
        is_finished: false,
        feedback: null,
      })
      .mockResolvedValueOnce({
        transcription: 'A1',
        next_question: null,
        is_finished: true,
        feedback: { score: 5, summary: '', strengths: [], improvements: [], recommendation: '' },
      });
    const { wrapper } = await mountInterviewView();
    await startInterviewFlow(wrapper);
    await recordAndSubmit(wrapper);
    expect(wrapper.find('h1').text()).toContain('Entrevista Concluída!');

    await wrapper.find('.btn-blue').trigger('click'); // "Nova Entrevista" button
    await flushPromises();

    expect(wrapper.find('h1').text()).toContain('Simulação de Entrevista');
  });
});
