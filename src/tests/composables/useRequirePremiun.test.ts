import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';
import { useRequirePremium } from '@/composables/useRequirePremiun';

// useRequirePremium uses useRouter(), which requires a real component
// context (Vue Router injection) — so it's tested through a minimal
// component instead of calling the function in isolation.
const TestComponent = defineComponent({
  setup() {
    useRequirePremium();
    return () => h('div');
  },
});

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/pricing', component: { template: '<div />' } },
    ],
  });
}

async function mountWithPlan(plan: string | undefined) {
  const pinia = createTestingPinia({ stubActions: false });
  setActivePinia(pinia);
  const auth = useAuthStore();
  auth.$patch({ profile: plan ? { plan } : null } as any);

  const router = createTestRouter();
  router.push('/');
  await router.isReady();

  mount(TestComponent, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return router;
}

describe('useRequirePremium', () => {
  it('redirects to /pricing when the user is not pro', async () => {
    const router = await mountWithPlan('free');

    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('redirects to /pricing when no profile is loaded', async () => {
    const router = await mountWithPlan(undefined);

    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('does NOT redirect when the user is pro', async () => {
    const router = await mountWithPlan('pro');

    expect(router.currentRoute.value.path).toBe('/');
  });
});
