import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import SettingsView from '@/views/SettingsView.vue';

const mockDashboardUser = ref<any>({ plan: 'practice', english_level: 'beginner' });
const mockUpdateLevel = vi.fn().mockResolvedValue(undefined);
const mockDeleteAccount = vi.fn().mockResolvedValue(undefined);
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    dashboardUser: mockDashboardUser,
    updateLevel: mockUpdateLevel,
    deleteAccount: mockDeleteAccount,
  }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/pricing', component: { template: '<div />' } },
      { path: '/placement-test', component: { template: '<div />' } },
    ],
  });
}

async function mountSettingsView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(SettingsView, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockDashboardUser.value = { plan: 'practice', english_level: 'beginner' };
  });

  it('toggles between light and dark theme, persisting to localStorage', async () => {
    const { wrapper } = await mountSettingsView();

    expect(wrapper.find('.toggle-btn').text()).toContain('Escuro');

    await wrapper.find('.toggle-btn').trigger('click');

    expect(wrapper.find('.toggle-btn').text()).toContain('Claro');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('loads the theme saved in localStorage on mount', async () => {
    localStorage.setItem('theme', 'dark');
    const { wrapper } = await mountSettingsView();

    expect(wrapper.find('.toggle-btn').text()).toContain('Claro');
  });

  it('the Free plan hides the model selector and shows the API key upgrade CTA', async () => {
    mockDashboardUser.value = { plan: 'free' };
    const { wrapper } = await mountSettingsView();

    expect(wrapper.text()).not.toContain('Modelo de IA');
    expect(wrapper.text()).toContain('Disponível nos planos pagos');
  });

  it('a paid plan shows the model selector and the API key field', async () => {
    const { wrapper } = await mountSettingsView();

    expect(wrapper.find('.select').exists()).toBe(true);
    expect(wrapper.find('.input').exists()).toBe(true);
  });

  it('saves the API key to localStorage and shows confirmation', async () => {
    const { wrapper } = await mountSettingsView();

    await wrapper.find('.input').setValue('sk-ant-minha-chave');
    await wrapper.find('.btn-primary').trigger('click'); // "Salvar chave" button

    expect(localStorage.getItem('userApiKey')).toBe('sk-ant-minha-chave');
    expect(wrapper.find('.btn-primary').text()).toContain('Salvo!');
  });

  it('does not save an empty API key', async () => {
    const { wrapper } = await mountSettingsView();

    await wrapper.find('.btn-primary').trigger('click');

    expect(localStorage.getItem('userApiKey')).toBeNull();
  });

  it('removes the saved API key', async () => {
    localStorage.setItem('userApiKey', 'sk-antiga');
    const { wrapper } = await mountSettingsView();

    expect(wrapper.find('.input').element.value).toBe('sk-antiga');
    await wrapper.find('.btn-ghost').trigger('click'); // "Remover" button

    expect(localStorage.getItem('userApiKey')).toBeNull();
    expect((wrapper.find('.input').element as HTMLInputElement).value).toBe('');
  });

  it('saves the selected AI model to localStorage', async () => {
    const { wrapper } = await mountSettingsView();

    await wrapper.find('.select').setValue('gpt-4o-mini');

    expect(localStorage.getItem('userModel')).toBe('gpt-4o-mini');
  });

  it('calls auth.updateLevel when saving the English level', async () => {
    const { wrapper } = await mountSettingsView();

    const selects = wrapper.findAll('select');
    const levelSelect = selects[selects.length - 1]; // the last select is the level one
    await levelSelect.setValue('advanced');
    const saveLevelBtn = wrapper.findAll('.btn-primary').find((b) => b.text().includes('nível'))!;
    await saveLevelBtn.trigger('click');
    await flushPromises();

    expect(mockUpdateLevel).toHaveBeenCalledWith('advanced');
  });

  it('blocks the placement test for a Free plan that already used it', async () => {
    mockDashboardUser.value = { plan: 'free', placement_test_done: true };
    const { wrapper } = await mountSettingsView();

    const testButtons = wrapper
      .findAll('.btn-primary')
      .filter((b) => b.text().toLowerCase().includes('teste'));
    expect(testButtons[0].attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Plano Free permite apenas 1 teste de nivelamento.');
  });

  it('allows the placement test when it has not been taken yet', async () => {
    mockDashboardUser.value = { plan: 'free', placement_test_done: false };
    const { wrapper, router } = await mountSettingsView();

    const testButtons = wrapper
      .findAll('.btn-primary')
      .filter((b) => b.text().toLowerCase().includes('teste'));
    expect(testButtons[0].attributes('disabled')).toBeUndefined();

    await testButtons[0].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/placement-test');
  });

  it('navigates to /pricing when clicking "Ver planos"', async () => {
    const { wrapper, router } = await mountSettingsView();

    await wrapper.find('.btn-outline').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('requires confirmation with the text "DELETAR" before deleting the account', async () => {
    const { wrapper } = await mountSettingsView();

    await wrapper.find('.btn-danger').trigger('click'); // "Deletar minha conta" button
    expect(wrapper.find('.delete-confirm').exists()).toBe(true);

    const confirmButton = wrapper.find('.delete-confirm .btn-danger');
    expect(confirmButton.attributes('disabled')).toBeDefined();

    await wrapper.find('.delete-confirm .input').setValue('DELETAR');
    expect(confirmButton.attributes('disabled')).toBeUndefined();

    await confirmButton.trigger('click');
    await flushPromises();

    expect(mockDeleteAccount).toHaveBeenCalled();
  });

  it('cancels the deletion and clears the confirmation text', async () => {
    const { wrapper } = await mountSettingsView();

    await wrapper.find('.btn-danger').trigger('click');
    await wrapper.find('.delete-confirm .input').setValue('DELETAR');
    await wrapper.find('.delete-confirm .btn-ghost').trigger('click'); // "Cancelar" button

    expect(wrapper.find('.delete-confirm').exists()).toBe(false);
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });
});
