import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFullUser,
  signIn,
  signUp,
  signOut,
  getProfile,
  signInWithGoogle,
} from '@/services/auth';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFullUser', () => {
    it('returns user + dashboard when there is an active session', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'a@b.com' } },
      } as any);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { plan: 'free', streak: 3 },
        error: null,
      } as any);

      const result = await getFullUser();

      expect(result).toEqual({
        user: { id: 'user-1', email: 'a@b.com' },
        dashboard: { plan: 'free', streak: 3 },
      });
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_dashboard', { uid: 'user-1' });
    });

    it('returns null when there is no authenticated user', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any);

      const result = await getFullUser();

      expect(result).toBeNull();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('returns the authenticated user with correct credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      } as any);

      const result = await signIn('a@b.com', '123456');

      expect(result).toEqual({ id: 'user-1' });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: '123456',
      });
    });

    it('throws an error with invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null },
        error: { message: 'Credenciais inválidas' },
      } as any);

      await expect(signIn('a@b.com', 'errada')).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('signUp', () => {
    it('creates the user with name in the metadata', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: 'user-2' } },
        error: null,
      } as any);

      const result = await signUp('novo@b.com', 'senha123', 'Novo Usuário');

      expect(result).toEqual({ id: 'user-2' });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'novo@b.com',
        password: 'senha123',
        options: { data: { name: 'Novo Usuário' } },
      });
    });

    it('throws an error when signup fails', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: { message: 'E-mail já cadastrado' },
      } as any);

      await expect(signUp('dup@b.com', '123', 'Dup')).rejects.toThrow('E-mail já cadastrado');
    });
  });

  describe('signOut', () => {
    it('logs out without error', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);

      await expect(signOut()).resolves.toBeUndefined();
    });

    it('throws an error when logout fails', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Erro ao deslogar' },
      } as any);

      await expect(signOut()).rejects.toThrow('Erro ao deslogar');
    });
  });

  describe('getProfile', () => {
    it('returns the user profile', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 'user-1', name: 'Fulano' },
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: singleMock }),
        }),
      } as any);

      const result = await getProfile('user-1');

      expect(result).toEqual({ id: 'user-1', name: 'Fulano' });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('throws an error when the profile is not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Não encontrado' } }),
          }),
        }),
      } as any);

      await expect(getProfile('inexistente')).rejects.toThrow('Não encontrado');
    });
  });

  describe('signInWithGoogle', () => {
    it('calls Google OAuth without throwing an error', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ error: null } as any);

      await expect(signInWithGoogle()).resolves.toBeUndefined();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' }),
      );
    });

    it('throws an error when OAuth fails', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        error: { message: 'OAuth falhou' },
      } as any);

      await expect(signInWithGoogle()).rejects.toThrow('OAuth falhou');
    });
  });
});
