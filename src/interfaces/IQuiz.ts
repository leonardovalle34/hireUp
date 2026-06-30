export interface QuizQuestion {
  id: string;
  level: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  category: string;
}
