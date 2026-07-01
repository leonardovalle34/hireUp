import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '@/App.vue';

const mockListenAuth = vi.fn();
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ listenAuth: mockListenAuth }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div class="home">Home</div>' } }],
  });
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('calls auth.listenAuth on mount', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    mount(App, { global: { plugins: [router] } });
    await flushPromises();

    expect(mockListenAuth).toHaveBeenCalled();
  });

  it('applies the dark theme saved in localStorage', async () => {
    localStorage.setItem('theme', 'dark');
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    mount(App, { global: { plugins: [router] } });
    await flushPromises();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('renders the current route via router-view', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const wrapper = mount(App, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.find('.home').exists()).toBe(true);
  });
});
