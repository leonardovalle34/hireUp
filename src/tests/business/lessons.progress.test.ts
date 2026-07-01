import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeLesson } from '@/services/lessons';
import { supabase } from '@/lib/supabase';

describe('Lessons — Progress and Completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('a lesson is completed only with score >= 4 (completed recorded in the upsert)', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as any);

    await completeLesson('user-1', 'lesson-1', 3);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ completed: false }),
      { onConflict: 'user_id,lesson_id' },
    );

    await completeLesson('user-1', 'lesson-1', 4);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true }),
      { onConflict: 'user_id,lesson_id' },
    );
  });

  it('calls check_and_award_badges when completing a lesson with score >= 4', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as any);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

    await completeLesson('user-1', 'lesson-1', 4);

    expect(supabase.rpc).toHaveBeenCalledWith('check_and_award_badges', { p_user_id: 'user-1' });
  });

  it('does NOT call badges when the score is < 4', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    await completeLesson('user-1', 'lesson-1', 3);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('throws an error and does not grant badges when the upsert fails', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'Falha ao salvar progresso' } }),
    } as any);

    await expect(completeLesson('user-1', 'lesson-1', 5)).rejects.toThrow('Falha ao salvar progresso');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
