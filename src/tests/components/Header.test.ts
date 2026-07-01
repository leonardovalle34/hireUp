import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import Antd from 'ant-design-vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import Header from '@/components/Header/Header.vue';

const mockDashboardUser = ref<any>(null);
const mockLogout = vi.fn();
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ dashboardUser: mockDashboardUser, logout: mockLogout }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/badges', component: { template: '<div />' } },
      { path: '/settings', component: { template: '<div />' } },
      { path: '/support', component: { template: '<div />' } },
    ],
  });
}

async function mountHeader() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(Header, { global: { plugins: [router, Antd] } });
  return { wrapper, router };
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardUser.value = null;
  });

  it("shows the first letter of the user's name in the avatar", async () => {
    mockDashboardUser.value = { name: 'fulano' };
    const { wrapper } = await mountHeader();

    expect(wrapper.find('.avatar-btn').text()).toBe('F');
  });

  it('uses the first letter of the email when there is no name', async () => {
    mockDashboardUser.value = { email: 'zeca@example.com' };
    const { wrapper } = await mountHeader();

    expect(wrapper.find('.avatar-btn').text()).toBe('Z');
  });

  it('uses "U" as a fallback when there is no name or email', async () => {
    const { wrapper } = await mountHeader();

    expect(wrapper.find('.avatar-btn').text()).toBe('U');
  });

  it('opens and closes the menu when clicking the avatar', async () => {
    const { wrapper } = await mountHeader();

    expect(wrapper.find('.avatar-menu').exists()).toBe(false);

    await wrapper.find('.avatar-btn').trigger('click');
    expect(wrapper.find('.avatar-menu').exists()).toBe(true);

    await wrapper.find('.avatar-btn').trigger('click');
    expect(wrapper.find('.avatar-menu').exists()).toBe(false);
  });

  it('navigates to /badges and closes the menu', async () => {
    const { wrapper, router } = await mountHeader();
    await wrapper.find('.avatar-btn').trigger('click');

    const badgesBtn = wrapper.findAll('.avatar-menu button').find((b) => b.text().includes('Conquistas'))!;
    await badgesBtn.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/badges');
    expect(wrapper.find('.avatar-menu').exists()).toBe(false);
  });

  it('navigates to /settings when clicking Configurações', async () => {
    const { wrapper, router } = await mountHeader();
    await wrapper.find('.avatar-btn').trigger('click');

    const settingsBtn = wrapper.findAll('.avatar-menu button').find((b) => b.text().includes('Configurações'))!;
    await settingsBtn.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/settings');
  });

  it('navigates to /support when clicking Suporte', async () => {
    const { wrapper, router } = await mountHeader();
    await wrapper.find('.avatar-btn').trigger('click');

    const supportBtn = wrapper.findAll('.avatar-menu button').find((b) => b.text().includes('Suporte'))!;
    await supportBtn.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/support');
  });

  it('calls auth.logout and closes the menu when clicking Sair', async () => {
    const { wrapper } = await mountHeader();
    await wrapper.find('.avatar-btn').trigger('click');

    const logoutBtn = wrapper.findAll('.avatar-menu button').find((b) => b.text().includes('Sair'))!;
    await logoutBtn.trigger('click');

    expect(mockLogout).toHaveBeenCalled();
    expect(wrapper.find('.avatar-menu').exists()).toBe(false);
  });

  it('closes the menu when clicking the overlay', async () => {
    const { wrapper } = await mountHeader();
    await wrapper.find('.avatar-btn').trigger('click');
    expect(wrapper.find('.overlay').exists()).toBe(true);

    await wrapper.find('.overlay').trigger('click');
    expect(wrapper.find('.avatar-menu').exists()).toBe(false);
  });
});
