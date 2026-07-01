import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callPlacementTest } from '@/services/placementTest';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

describe('placementTest service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('sends the form and returns the result when authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } },
    } as any);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ level: 'intermediate', final_score: 60 }),
    } as any);

    const result = await callPlacementTest(new FormData());

    expect(result).toEqual({ level: 'intermediate', final_score: 60 });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/placement-test',
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer tok-123' } }),
    );
  });

  it('throws an error when there is no authenticated session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);

    await expect(callPlacementTest(new FormData())).rejects.toThrow('Não autenticado');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('propagates the error returned by the edge function', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } },
    } as any);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Internal error' }),
    } as any);

    await expect(callPlacementTest(new FormData())).rejects.toThrow('Internal error');
  });
});
