import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '@/router';

// Tests the real guard registered in router.beforeEach (src/router/index.ts),
// actually navigating through the router singleton — without mounting any
// view (the guard runs during route resolution, before any render).

const mockAuthState: any = { user: null, fetchUser: vi.fn() };
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthState,
}));

describe('router — authentication guard', () => {
  beforeEach(async () => {
    mockAuthState.user = null;
    mockAuthState.fetchUser = vi.fn(async () => {});
    await router.push('/login');
    await router.isReady();
    // The baseline navigation above already triggers the guard (null user) —
    // clear that call so each test starts with a zeroed count.
    mockAuthState.fetchUser.mockClear();
  });

  it('redirects to /login when an unauthenticated user tries to access a protected route', async () => {
    await router.push('/pricing');

    expect(mockAuthState.fetchUser).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('allows access when fetchUser authenticates the user during navigation', async () => {
    mockAuthState.fetchUser = vi.fn(async () => {
      mockAuthState.user = { id: 'user-1' };
    });

    await router.push('/pricing');

    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('does not call fetchUser again when the user is already authenticated in state', async () => {
    mockAuthState.user = { id: 'user-1' };

    await router.push('/pricing');

    expect(mockAuthState.fetchUser).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('redirects an already authenticated user from /login to /', async () => {
    mockAuthState.user = { id: 'user-1' };
    await router.push('/pricing'); // leave /login to avoid a repeated (no-op) navigation

    await router.push('/login');

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('allows access to a public route (/auth/callback) even without authentication', async () => {
    await router.push('/auth/callback');

    expect(router.currentRoute.value.path).toBe('/auth/callback');
  });
});
