import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLessons,
  getLessonById,
  getUserProgress,
  completeLesson,
  getUserBadges,
} from '@/services/lessons';
import { supabase } from '@/lib/supabase';

describe('lessons service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLessons', () => {
    it('returns a list of lessons ordered by order_num', async () => {
      const mockLessons = [
        { id: '1', title: 'Test Lesson', level: 'beginner', order_num: 1 },
      ];
      const orderMock = vi.fn().mockResolvedValue({ data: mockLessons, error: null });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const result = await getLessons();

      expect(result).toEqual(mockLessons);
      expect(supabase.from).toHaveBeenCalledWith('course_lessons');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock).toHaveBeenCalledWith('order_num');
    });

    it('throws an error when Supabase returns an error', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      } as any);

      await expect(getLessons()).rejects.toThrow('DB error');
    });
  });

  describe('getLessonById', () => {
    it('returns a lesson by ID', async () => {
      const mockLesson = { id: '1', title: 'Test Lesson', level: 'beginner' };
      const singleMock = vi.fn().mockResolvedValue({ data: mockLesson, error: null });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const result = await getLessonById('1');

      expect(result).toEqual(mockLesson);
      expect(supabase.from).toHaveBeenCalledWith('course_lessons');
      expect(eqMock).toHaveBeenCalledWith('id', '1');
    });

    it('throws an error when the lesson is not found', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Lesson not found' },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: singleMock }),
        }),
      } as any);

      await expect(getLessonById('nonexistent')).rejects.toThrow('Lesson not found');
    });
  });

  describe('getUserProgress', () => {
    it('returns the user progress', async () => {
      const mockProgress = [
        { lesson_id: '1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
      ];
      const eqMock = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqMock }),
      } as any);

      const result = await getUserProgress('user-1');

      expect(result).toEqual(mockProgress);
      expect(supabase.from).toHaveBeenCalledWith('user_lesson_progress');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('returns an empty array when there is no data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      const result = await getUserProgress('user-1');

      expect(result).toEqual([]);
    });

    it('throws an error when Supabase returns an error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      } as any);

      await expect(getUserProgress('user-1')).rejects.toThrow('DB error');
    });
  });

  describe('completeLesson', () => {
    it('saves the progress and calls check_and_award_badges when score >= 4', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

      await completeLesson('user-1', 'lesson-1', 4);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          completed: true,
          quiz_score: 4,
        }),
        { onConflict: 'user_id,lesson_id' },
      );
      expect(supabase.rpc).toHaveBeenCalledWith('check_and_award_badges', { p_user_id: 'user-1' });
    });

    it('does NOT call check_and_award_badges when score < 4', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as any);

      await completeLesson('user-1', 'lesson-1', 3);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false, quiz_score: 3 }),
        { onConflict: 'user_id,lesson_id' },
      );
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('throws an error when the upsert fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
      } as any);

      await expect(completeLesson('user-1', 'lesson-1', 5)).rejects.toThrow('Upsert failed');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('getUserBadges', () => {
    it('returns the user badges', async () => {
      const mockBadges = [{ badge_type: 'beginner_graduate', earned_at: '2026-01-01' }];
      const orderMock = vi.fn().mockResolvedValue({ data: mockBadges, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqMock }),
      } as any);

      const result = await getUserBadges('user-1');

      expect(result).toEqual(mockBadges);
      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('throws an error when Supabase returns an error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as any);

      await expect(getUserBadges('user-1')).rejects.toThrow('DB error');
    });
  });
});
