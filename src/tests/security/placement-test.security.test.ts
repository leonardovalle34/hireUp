import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import PlacementTestView from '@/views/PlacementTestView.vue';

vi.mock('ant-design-vue', () => ({
  message: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

let mockDashboardUser: any = null;
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    get dashboardUser() {
      return mockDashboardUser;
    },
  }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/placement-test', component: PlacementTestView },
      { path: '/settings', component: { template: '<div>Settings</div>' } },
    ],
  });
}

async function mountPlacementTestView() {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createTestRouter();
  router.push('/placement-test');
  await router.isReady();
  const wrapper = mount(PlacementTestView, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('Placement Test — Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardUser = null;
  });

  it('blocks Free from retaking the placement test, redirecting to /settings', async () => {
    mockDashboardUser = { plan: 'free', placement_test_done: true };

    const { router } = await mountPlacementTestView();

    expect(router.currentRoute.value.path).toBe('/settings');
  });

  it('blocks Practice from retaking before 30 days have passed', async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    mockDashboardUser = {
      plan: 'practice',
      placement_test_done: true,
      placement_test_done_at: fiveDaysAgo,
    };

    const { router } = await mountPlacementTestView();

    expect(router.currentRoute.value.path).toBe('/settings');
  });

  it('allows Practice to retake the test after 30 days', async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    mockDashboardUser = {
      plan: 'practice',
      placement_test_done: true,
      placement_test_done_at: thirtyOneDaysAgo,
    };

    const { router } = await mountPlacementTestView();

    expect(router.currentRoute.value.path).toBe('/placement-test');
  });

  it('does not block when the test has not been taken yet', async () => {
    mockDashboardUser = { plan: 'free', placement_test_done: false };

    const { router } = await mountPlacementTestView();

    expect(router.currentRoute.value.path).toBe('/placement-test');
  });

  // The rule below runs entirely on the server (Deno Edge Function at
  // supabase/functions/placement-test/index.ts:307-343) and cannot be
  // executed by Vitest. This test is a specification: it reproduces the
  // EXACT logic implemented there today (verified by reading the source
  // directly), not a real integration test.
  it('final level never downgrades after the test (mirrors the real server-side rule)', () => {
    const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced', 'business'];
    const computeFinalLevel = (currentLevel: string, testResultLevel: string) => {
      const currentIndex = levelOrder.indexOf(currentLevel);
      const testResultIndex = levelOrder.indexOf(testResultLevel);
      return testResultIndex >= currentIndex ? testResultLevel : currentLevel;
    };

    expect(computeFinalLevel('advanced', 'elementary')).toBe('advanced');
    expect(computeFinalLevel('beginner', 'advanced')).toBe('advanced');
    expect(computeFinalLevel('intermediate', 'intermediate')).toBe('intermediate');
  });
});
