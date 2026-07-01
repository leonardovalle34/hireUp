import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import BadgesView from '@/views/BadgesView.vue';
import { getUserBadges } from '@/services/lessons';

// Badge granting happens entirely on the server via the
// `check_and_award_badges` RPC (real call in src/services/lessons.ts:53,
// already covered in business/lessons.progress.test.ts) — there is no
// frontend `checkBadgeEligibility` function that decides the per-level
// requirements. So instead of reimplementing those numbers fictitiously,
// this file validates the real copy rendered by BadgesView.vue (content
// regression) and the real, conditional behavior of the certificate button.

vi.mock('@/services/lessons', () => ({ getUserBadges: vi.fn() }));

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

describe('Badges — Granting and Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('badge descriptions reflect the real per-level lesson requirements', async () => {
    vi.mocked(getUserBadges).mockResolvedValue([]);

    const { wrapper } = await mountBadgesView();
    const descriptions = wrapper.findAll('.badge-desc').map((d) => d.text());

    expect(descriptions).toEqual([
      'Completou todas as 8 aulas Beginner',
      'Completou todas as 8 aulas Elementary',
      'Completou todas as 10 aulas Intermediate',
      'Completou todas as 8 aulas Advanced',
      'Completou todas as 6 aulas Business English',
      'Completou as 40 aulas — curso inteiro!',
    ]);
  });

  it('the "Ver Certificado" button only appears when the hireup_master badge is present', async () => {
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

  it('clicking "Ver Certificado" navigates to /certificate', async () => {
    vi.mocked(getUserBadges).mockResolvedValue([
      { badge_type: 'hireup_master', earned_at: '2026-01-02' },
    ] as any);
    const { wrapper, router } = await mountBadgesView();

    await wrapper.find('.btn-certificate').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/certificate');
  });
});
