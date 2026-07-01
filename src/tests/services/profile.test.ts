import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateEnglishLevel } from '@/services/profile';
import { supabase } from '@/lib/supabase';

describe('profile service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the user\'s English level', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    } as any);

    await expect(updateEnglishLevel('user-1', 'advanced')).resolves.toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(eqMock).toHaveBeenCalledWith('id', 'user-1');
  });

  it('throws an error when the update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Failed to update level' } }),
      }),
    } as any);

    await expect(updateEnglishLevel('user-1', 'advanced')).rejects.toThrow('Failed to update level');
  });
});
