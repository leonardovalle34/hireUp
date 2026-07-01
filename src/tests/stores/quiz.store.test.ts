import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useQuizStore } from '@/stores/quiz';
import {
  getNextQuestions,
  saveAnswer,
  getQuizUsageToday,
  incrementQuizUsage,
  getQuizDailyLimit,
} from '@/services/quiz';

vi.mock('@/services/quiz', () => ({
  getNextQuestions: vi.fn(),
  saveAnswer: vi.fn(),
  getQuizUsageToday: vi.fn(),
  incrementQuizUsage: vi.fn(),
  getQuizDailyLimit: vi.fn(),
}));

const mockQuestions = [
  { id: 'q1', level: 'beginner', question: 'Q1?', options: ['a', 'b'], answer: 1, explanation: '', category: 'grammar' },
  { id: 'q2', level: 'beginner', question: 'Q2?', options: ['a', 'b'], answer: 0, explanation: '', category: 'grammar' },
  { id: 'q3', level: 'beginner', question: 'Q3?', options: ['a', 'b'], answer: 1, explanation: '', category: 'grammar' },
];

describe('quiz store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }));
    vi.clearAllMocks();
  });

  describe('loadQuestions', () => {
    it('populates questions and resets currentIndex and score', async () => {
      vi.mocked(getNextQuestions).mockResolvedValue(mockQuestions as any);

      const store = useQuizStore();
      store.$patch({ currentIndex: 2, score: 5 });

      await store.loadQuestions('user-1', 'beginner', 10);

      expect(store.questions).toEqual(mockQuestions);
      expect(store.currentIndex).toBe(0);
      expect(store.score).toBe(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(getNextQuestions).toHaveBeenCalledWith('user-1', 'beginner', 10);
    });

    it('records the error message when the service fails', async () => {
      vi.mocked(getNextQuestions).mockRejectedValue(new Error('Falha ao buscar perguntas'));

      const store = useQuizStore();
      await store.loadQuestions('user-1', 'beginner', 10);

      expect(store.error).toBe('Falha ao buscar perguntas');
      expect(store.loading).toBe(false);
    });
  });

  describe('answerQuestion', () => {
    it('increments score when the answer is correct and calls saveAnswer/incrementQuizUsage', async () => {
      const store = useQuizStore();
      store.$patch({ questions: mockQuestions as any, currentIndex: 0, score: 0 });

      const result = await store.answerQuestion('user-1', 1);

      expect(result).toBe(true);
      expect(store.score).toBe(1);
      expect(saveAnswer).toHaveBeenCalledWith('user-1', 'q1', true);
      expect(incrementQuizUsage).toHaveBeenCalledWith('user-1');
    });

    it('does NOT increment score when the answer is incorrect', async () => {
      const store = useQuizStore();
      store.$patch({ questions: mockQuestions as any, currentIndex: 0, score: 0 });

      const result = await store.answerQuestion('user-1', 0);

      expect(result).toBe(false);
      expect(store.score).toBe(0);
      expect(saveAnswer).toHaveBeenCalledWith('user-1', 'q1', false);
    });

    it('returns false and does not call saveAnswer when there is no current question', async () => {
      const store = useQuizStore();
      store.$patch({ questions: [], currentIndex: 0 });

      const result = await store.answerQuestion('user-1', 0);

      expect(result).toBe(false);
      expect(saveAnswer).not.toHaveBeenCalled();
      expect(incrementQuizUsage).not.toHaveBeenCalled();
    });
  });

  describe('nextQuestion', () => {
    it('advances currentIndex without exceeding the total number of questions', () => {
      const store = useQuizStore();
      store.$patch({ questions: mockQuestions as any, currentIndex: 0 });

      store.nextQuestion();
      expect(store.currentIndex).toBe(1);

      store.nextQuestion();
      expect(store.currentIndex).toBe(2);

      store.nextQuestion();
      expect(store.currentIndex).toBe(2); // already the last one, doesn't advance further
    });
  });

  describe('getDailyLimit', () => {
    it('delegates to the service\'s getQuizDailyLimit', () => {
      vi.mocked(getQuizDailyLimit).mockReturnValue(20);

      const store = useQuizStore();
      const result = store.getDailyLimit('free');

      expect(result).toBe(20);
      expect(getQuizDailyLimit).toHaveBeenCalledWith('free');
    });
  });

  describe('fetchUsageToday', () => {
    it('populates usageToday with the service\'s return value', async () => {
      vi.mocked(getQuizUsageToday).mockResolvedValue(7);

      const store = useQuizStore();
      await store.fetchUsageToday('user-1');

      expect(store.usageToday).toBe(7);
    });
  });

  describe('getters', () => {
    it('currentQuestion returns the question at the current index or null', () => {
      const store = useQuizStore();
      expect(store.currentQuestion).toBeNull();

      store.$patch({ questions: mockQuestions as any, currentIndex: 1 });
      expect(store.currentQuestion).toEqual(mockQuestions[1]);
    });

    it('isLastQuestion is true only on the last question', () => {
      const store = useQuizStore();
      store.$patch({ questions: mockQuestions as any, currentIndex: 1 });
      expect(store.isLastQuestion).toBe(false);

      store.$patch({ currentIndex: 2 });
      expect(store.isLastQuestion).toBe(true);
    });

    it('progress calculates the percentage based on the current index', () => {
      const store = useQuizStore();
      expect(store.progress).toBe(0);

      store.$patch({ questions: mockQuestions as any, currentIndex: 0 });
      expect(store.progress).toBeCloseTo(33.33, 1);

      store.$patch({ currentIndex: 2 });
      expect(store.progress).toBe(100);
    });
  });
});
