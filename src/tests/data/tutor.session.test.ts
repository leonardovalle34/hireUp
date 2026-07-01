import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import TutorView from '@/views/TutorView.vue';
import { getLessons } from '@/services/lessons';
import { sendTutorMessage } from '@/services/tutor';
import { supabase } from '@/lib/supabase';

vi.mock('@/services/lessons', () => ({ getLessons: vi.fn() }));
vi.mock('@/services/tutor', () => ({ sendTutorMessage: vi.fn() }));
vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const mockDashboardUser = ref<any>({ english_level: 'beginner', plan: 'practice' });
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    dashboardUser: mockDashboardUser,
  }),
}));

function mockTutorSessionsTable(sessionId = 'session-1') {
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: sessionId }, error: null }),
    }),
  });

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'tutor_sessions') {
      return { insert: insertMock, update: updateMock } as any;
    }
    throw new Error(`tabela inesperada: ${table}`);
  });

  return { insertMock, updateMock };
}

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

describe('Tutor — Session and Duration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDashboardUser.value = { english_level: 'beginner', plan: 'practice' };
    vi.mocked(getLessons).mockResolvedValue([]);
    vi.mocked(sendTutorMessage).mockResolvedValue({
      history: [],
      tutor_response: 'Hi! Let\'s talk.',
      tutor_response_clean: 'Hi! Let\'s talk.',
      tutor_name: 'Ana',
    } as any);
  });

  it('creates the session in Supabase and saves the real duration_seconds on ending', async () => {
    const { insertMock, updateMock } = mockTutorSessionsTable('session-42');
    const { wrapper } = await mountTutorView();

    await wrapper.find('.btn-blue').trigger('click'); // "Iniciar conversa" button
    await flushPromises();

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1' }),
    );
    expect(wrapper.find('.btn-end').exists()).toBe(true); // entered the 'session' stage

    await wrapper.find('.btn-end').trigger('click'); // "✕ Encerrar" button
    await flushPromises();

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ duration_seconds: expect.any(Number) }),
    );
    const [{ eq: eqFromUpdate }] = updateMock.mock.results.map((r) => r.value);
    expect(eqFromUpdate).toHaveBeenCalledWith('id', 'session-42');
  });

  it('blocks starting a new session after reaching 1800s (30min) of usage without an API key', async () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`tutor_time_${today}`, String(30 * 60 * 1000));
    const { insertMock } = mockTutorSessionsTable();

    const { wrapper } = await mountTutorView();
    await wrapper.find('.btn-blue').trigger('click'); // "Iniciar conversa" button
    await flushPromises();

    expect(insertMock).not.toHaveBeenCalled();
    expect(wrapper.find('.btn-end').exists()).toBe(false); // stays on the 'intro' stage
  });

  it('allows starting a session when today\'s usage is below the limit', async () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`tutor_time_${today}`, String(10 * 60 * 1000)); // 10min used
    const { insertMock } = mockTutorSessionsTable();

    const { wrapper } = await mountTutorView();
    await wrapper.find('.btn-blue').trigger('click');
    await flushPromises();

    expect(insertMock).toHaveBeenCalled();
    expect(wrapper.find('.btn-end').exists()).toBe(true);
  });
});
