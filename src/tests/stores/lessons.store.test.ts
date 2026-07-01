import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useLessonsStore } from '@/stores/lessons';
import { getLessons, getUserProgress, completeLesson } from '@/services/lessons';

vi.mock('@/services/lessons', () => ({
  getLessons: vi.fn(),
  getUserProgress: vi.fn(),
  completeLesson: vi.fn(),
}));

describe('lessons store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }));
    vi.clearAllMocks();
  });

  describe('fetchLessons', () => {
    it('populates state.lessons and toggles loading correctly', async () => {
      const mockLessons = [
        { id: '1', title: 'Lição 1', level: 'beginner' },
        { id: '2', title: 'Lição 2', level: 'intermediate' },
      ];
      vi.mocked(getLessons).mockResolvedValue(mockLessons as any);

      const store = useLessonsStore();
      const promise = store.fetchLessons();
      expect(store.loading).toBe(true);
      await promise;

      expect(store.lessons).toEqual(mockLessons);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('records the error message when the service fails', async () => {
      vi.mocked(getLessons).mockRejectedValue(new Error('Falha ao buscar aulas'));

      const store = useLessonsStore();
      await store.fetchLessons();

      expect(store.error).toBe('Falha ao buscar aulas');
      expect(store.loading).toBe(false);
      expect(store.lessons).toEqual([]);
    });
  });

  describe('fetchProgress', () => {
    it('populates state.progress', async () => {
      const mockProgress = [
        { lesson_id: '1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
      ];
      vi.mocked(getUserProgress).mockResolvedValue(mockProgress as any);

      const store = useLessonsStore();
      await store.fetchProgress('user-1');

      expect(store.progress).toEqual(mockProgress);
      expect(getUserProgress).toHaveBeenCalledWith('user-1');
    });

    it('records the error message when the service fails', async () => {
      vi.mocked(getUserProgress).mockRejectedValue(new Error('Falha ao buscar progresso'));

      const store = useLessonsStore();
      await store.fetchProgress('user-1');

      expect(store.error).toBe('Falha ao buscar progresso');
    });
  });

  describe('saveProgress', () => {
    it('calls completeLesson and redoes the fetchProgress', async () => {
      const updatedProgress = [
        { lesson_id: 'lesson-1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: '2026-06-30' },
      ];
      vi.mocked(completeLesson).mockResolvedValue(undefined);
      vi.mocked(getUserProgress).mockResolvedValue(updatedProgress as any);

      const store = useLessonsStore();
      await store.saveProgress('user-1', 'lesson-1', 5);

      expect(completeLesson).toHaveBeenCalledWith('user-1', 'lesson-1', 5);
      expect(getUserProgress).toHaveBeenCalledWith('user-1');
      expect(store.progress).toEqual(updatedProgress);
    });
  });

  describe('getters', () => {
    it('completedCount only counts the completed progress', async () => {
      vi.mocked(getUserProgress).mockResolvedValue([
        { lesson_id: '1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
        { lesson_id: '2', completed: false, quiz_score: 2, quiz_attempts: 1, completed_at: null },
        { lesson_id: '3', completed: true, quiz_score: 4, quiz_attempts: 1, completed_at: null },
      ] as any);

      const store = useLessonsStore();
      await store.fetchProgress('user-1');

      expect(store.completedCount).toBe(2);
    });

    it('getProgress returns the progress for the given lesson', async () => {
      vi.mocked(getUserProgress).mockResolvedValue([
        { lesson_id: 'lesson-1', completed: true, quiz_score: 5, quiz_attempts: 1, completed_at: null },
      ] as any);

      const store = useLessonsStore();
      await store.fetchProgress('user-1');

      expect(store.getProgress('lesson-1')?.completed).toBe(true);
      expect(store.getProgress('nonexistent-lesson')).toBeUndefined();
    });

    it('lessonsByLevel filters by level, and "all" returns every lesson', async () => {
      vi.mocked(getLessons).mockResolvedValue([
        { id: '1', title: 'Lição 1', level: 'beginner' },
        { id: '2', title: 'Lição 2', level: 'intermediate' },
        { id: '3', title: 'Lição 3', level: 'beginner' },
      ] as any);

      const store = useLessonsStore();
      await store.fetchLessons();

      expect(store.lessonsByLevel('beginner')).toHaveLength(2);
      expect(store.lessonsByLevel('all')).toHaveLength(3);
    });
  });
});
