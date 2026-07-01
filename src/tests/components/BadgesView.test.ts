import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import BadgesView from '@/views/BadgesView.vue';
import { getUserBadges } from '@/services/lessons';

vi.mock('@/services/lessons', () => ({
  getUserBadges: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/certificate', component: { template: '<div />' } },
    ],
  });
}

async function mountBadgesView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(BadgesView, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('BadgesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 6 badges', async () => {
    vi.mocked(getUserBadges).mockResolvedValue([]);

    const { wrapper } = await mountBadgesView();

    expect(wrapper.findAll('.badge-card')).toHaveLength(6);
  });

  it('earned badges appear with a different style than locked ones', async () => {
    vi.mocked(getUserBadges).mockResolvedValue([
      { badge_type: 'beginner_graduate', earned_at: '2026-01-01' },
    ] as any);

    const { wrapper } = await mountBadgesView();
    const cards = wrapper.findAll('.badge-card');
    const earned = cards.filter((c) => c.classes().includes('earned'));
    const locked = cards.filter((c) => !c.classes().includes('earned'));

    expect(earned).toHaveLength(1);
    expect(locked).toHaveLength(5);
    expect(earned[0].text()).not.toContain('🔒');
    locked.forEach((card) => expect(card.text()).toContain('🔒'));
  });

  it('"Ver Certificado" button appears only when the hireup_master badge is present', async () => {
    vi.mocked(getUserBadges).mockResolvedValue([
      { badge_type: 'beginner_graduate', earned_at: '2026-01-01' },
    ] as any);
    const { wrapper: withoutMaster } = await mountBadgesView();
    expect(withoutMaster.find('.btn-certificate').exists()).toBe(false);

    vi.mocked(getUserBadges).mockResolvedValue([
      { badge_type: 'hireup_master', earned_at: '2026-01-02' },
    ] as any);
    const { wrapper: withMaster } = await mountBadgesView();
    expect(withMaster.find('.btn-certificate').exists()).toBe(true);
  });
});
