import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import Antd from 'ant-design-vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

const mockDashboardUser = ref<any>(null);
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ dashboardUser: mockDashboardUser, logout: vi.fn() }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: AppLayout,
        children: [{ path: '', component: { template: '<div class="dashboard-stub">Dashboard</div>' } }],
      },
    ],
  });
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Header, NavMenu and the child route content', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const wrapper = mount(AppLayout, { global: { plugins: [router, Antd] } });
    await flushPromises();

    expect(wrapper.find('.header').exists()).toBe(true);
    expect(wrapper.find('.nav-menu').exists()).toBe(true);
    expect(wrapper.find('.dashboard-stub').exists()).toBe(true);
  });
});
