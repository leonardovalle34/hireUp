import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';
import { useUserPlan } from '@/composables/useUserPlan';

describe('useUserPlan', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }));
  });

  it('returns "free" when no profile is loaded', () => {
    const { plan, isFree, isPro } = useUserPlan();

    expect(plan.value).toBe('free');
    expect(isFree.value).toBe(true);
    expect(isPro.value).toBe(false);
  });

  it('reflects the profile\'s "pro" plan', () => {
    const auth = useAuthStore();
    auth.$patch({ profile: { plan: 'pro' } } as any);

    const { plan, isFree, isPro } = useUserPlan();

    expect(plan.value).toBe('pro');
    expect(isFree.value).toBe(false);
    expect(isPro.value).toBe(true);
  });
});
