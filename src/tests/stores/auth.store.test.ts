import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';
import { signIn, signUp, signOut, getFullUser } from '@/services/auth';
import { deleteAccount } from '@/services/account';
import { updateEnglishLevel } from '@/services/profile';
import { supabase } from '@/lib/supabase';

vi.mock('@/router', () => ({ default: { push: vi.fn() } }));
vi.mock('@/services/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getFullUser: vi.fn(),
}));
vi.mock('@/services/account', () => ({ deleteAccount: vi.fn() }));
vi.mock('@/services/profile', () => ({ updateEnglishLevel: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() } },
}));

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }));
    vi.clearAllMocks();
  });

  describe('fetchUser', () => {
    it('populates user and dashboardUser when authenticated', async () => {
      vi.mocked(getFullUser).mockResolvedValue({
        user: { id: 'user-1' },
        dashboard: { plan: 'free' },
      } as any);

      const store = useAuthStore();
      await store.fetchUser();

      expect(store.user).toEqual({ id: 'user-1' });
      expect(store.dashboardUser).toEqual({ plan: 'free' });
      expect(store.loading).toBe(false);
    });

    it('resets user and dashboardUser when there is no session', async () => {
      vi.mocked(getFullUser).mockResolvedValue(null);

      const store = useAuthStore();
      store.$patch({ user: { id: 'old' } } as any);
      await store.fetchUser();

      expect(store.user).toBeNull();
      expect(store.dashboardUser).toBeNull();
    });

    it('records the error when the service fails', async () => {
      vi.mocked(getFullUser).mockRejectedValue(new Error('Falha ao buscar usuário'));

      const store = useAuthStore();
      await store.fetchUser();

      expect(store.error).toBe('Falha ao buscar usuário');
      expect(store.loading).toBe(false);
    });
  });

  describe('login', () => {
    it('authenticates and fetches the user data', async () => {
      vi.mocked(signIn).mockResolvedValue({ id: 'user-1' } as any);
      vi.mocked(getFullUser).mockResolvedValue({
        user: { id: 'user-1' },
        dashboard: { plan: 'free' },
      } as any);

      const store = useAuthStore();
      await store.login('a@b.com', '123456');

      expect(signIn).toHaveBeenCalledWith('a@b.com', '123456');
      expect(store.user).toEqual({ id: 'user-1' });
      expect(store.error).toBe('');
    });

    it('records the error and does not throw when the credentials are invalid', async () => {
      vi.mocked(signIn).mockRejectedValue(new Error('Credenciais inválidas'));

      const store = useAuthStore();
      await expect(store.login('a@b.com', 'errada')).resolves.toBeUndefined();

      expect(store.error).toBe('Credenciais inválidas');
      expect(store.loading).toBe(false);
    });
  });

  describe('register', () => {
    it('creates the user', async () => {
      vi.mocked(signUp).mockResolvedValue({ id: 'user-novo' } as any);

      const store = useAuthStore();
      await store.register('novo@b.com', '123456', 'Novo');

      expect(store.user).toEqual({ id: 'user-novo' });
      expect(store.error).toBe('');
    });

    it('records the error when signup fails', async () => {
      vi.mocked(signUp).mockRejectedValue(new Error('E-mail já cadastrado'));

      const store = useAuthStore();
      await store.register('dup@b.com', '123456', 'Dup');

      expect(store.error).toBe('E-mail já cadastrado');
    });
  });

  describe('logout', () => {
    it('logs out, resets the state and redirects to /login', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);
      const router = (await import('@/router')).default;

      const store = useAuthStore();
      store.$patch({ user: { id: 'user-1' }, profile: { plan: 'free' } } as any);
      await store.logout();

      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('deleteAccount', () => {
    it('deletes the account, logs out and redirects to /login', async () => {
      vi.mocked(deleteAccount).mockResolvedValue(true);
      vi.mocked(signOut).mockResolvedValue(undefined);
      const router = (await import('@/router')).default;

      const store = useAuthStore();
      store.$patch({ user: { id: 'user-1' }, dashboardUser: { plan: 'free' } } as any);
      await store.deleteAccount();

      expect(store.user).toBeNull();
      expect(store.dashboardUser).toBeNull();
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('records the error and does NOT redirect when the deletion fails', async () => {
      vi.mocked(deleteAccount).mockRejectedValue(new Error('Erro ao deletar conta'));
      const router = (await import('@/router')).default;

      const store = useAuthStore();
      await store.deleteAccount();

      expect(store.error).toBe('Erro ao deletar conta');
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('listenAuth', () => {
    it('updates user when receiving a valid session', () => {
      const store = useAuthStore();
      store.listenAuth();

      const callback = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      callback('SIGNED_IN', { user: { id: 'user-1' } } as any);

      expect(store.user).toEqual({ id: 'user-1' });
    });

    it('resets dashboardUser and profile when the session ends', () => {
      const store = useAuthStore();
      store.$patch({ dashboardUser: { plan: 'free' }, profile: { x: 1 } } as any);
      store.listenAuth();

      const callback = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      callback('SIGNED_OUT', null as any);

      expect(store.user).toBeNull();
      expect(store.dashboardUser).toBeNull();
      expect(store.profile).toBeNull();
    });
  });

  describe('updateLevel', () => {
    it('updates the level locally without needing a refetch', async () => {
      vi.mocked(updateEnglishLevel).mockResolvedValue(true);

      const store = useAuthStore();
      store.$patch({ user: { id: 'user-1' }, dashboardUser: { english_level: 'beginner' } } as any);
      await store.updateLevel('intermediate');

      expect(updateEnglishLevel).toHaveBeenCalledWith('user-1', 'intermediate');
      expect((store.dashboardUser as any).english_level).toBe('intermediate');
    });

    it('records an error when the user is not authenticated', async () => {
      const store = useAuthStore();
      store.$patch({ user: null } as any);
      await store.updateLevel('intermediate');

      expect(store.error).toBe('Usuário não autenticado');
      expect(updateEnglishLevel).not.toHaveBeenCalled();
    });
  });
});
