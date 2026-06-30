import { defineStore } from 'pinia';
import {
  getNextQuestions,
  saveAnswer,
  getQuizUsageToday,
  incrementQuizUsage,
  getQuizDailyLimit,
  type QuizQuestion,
} from '@/services/quiz';

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    questions: [] as QuizQuestion[],
    currentIndex: 0,
    score: 0,
    loading: false,
    error: null as string | null,
    usageToday: 0,
  }),

  getters: {
    currentQuestion: (state) => state.questions[state.currentIndex] || null,
    isLastQuestion: (state) => state.currentIndex >= state.questions.length - 1,
    progress: (state) => state.questions.length > 0 ? ((state.currentIndex + 1) / state.questions.length) * 100 : 0,
  },

  actions: {
    async loadQuestions(userId: string, level: string, count: number = 10) {
      this.loading = true;
      this.error = null;
      try {
        this.questions = await getNextQuestions(userId, level, count);
        this.currentIndex = 0;
        this.score = 0;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async answerQuestion(userId: string, answerIndex: number): Promise<boolean> {
      const question = this.currentQuestion;
      if (!question) return false;

      const correct = answerIndex === question.answer;
      if (correct) this.score++;

      await saveAnswer(userId, question.id, correct);
      await incrementQuizUsage(userId);

      return correct;
    },

    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
      }
    },

    async fetchUsageToday(userId: string) {
      this.usageToday = await getQuizUsageToday(userId);
    },

    getDailyLimit(plan: string) {
      return getQuizDailyLimit(plan);
    },
  },
});
