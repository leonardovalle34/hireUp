import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AuthCallback from '@/views/AuthCallback.vue';
import { supabase } from '@/lib/supabase';

// AuthCallback.vue handles the Supabase OAuth flow return
// (supabase.auth.exchangeCodeForSession), not a Stripe payment return.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  },
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/auth/callback', component: AuthCallback },
    ],
  });
}

async function mountAuthCallback() {
  const router = createTestRouter();
  router.push('/auth/callback');
  await router.isReady();
  const wrapper = mount(AuthCallback, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges the code for a session and redirects to /dashboard on success', async () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({ error: null } as any);

    const { router } = await mountAuthCallback();

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(window.location.href);
    expect(router.currentRoute.value.path).toBe('/dashboard');
  });

  it('logs the error and redirects to /login when the session exchange fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
      error: { message: 'Código inválido' },
    } as any);

    const { router } = await mountAuthCallback();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/login');

    consoleErrorSpy.mockRestore();
  });
});
