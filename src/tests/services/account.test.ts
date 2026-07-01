import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAccount } from '@/services/account';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

describe('account service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('deletes the account when authenticated and the API responds ok', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } },
    } as any);
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as any);

    await expect(deleteAccount()).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/delete-account',
      { method: 'POST', headers: { Authorization: 'Bearer tok-123' } },
    );
  });

  it('throws an error when there is no authenticated session, without calling the API', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);

    await expect(deleteAccount()).rejects.toThrow('Não autenticado');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws an error when the API returns a failure', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } },
    } as any);
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as any);

    await expect(deleteAccount()).rejects.toThrow('Erro ao deletar conta');
  });
});
