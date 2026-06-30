export interface PlacementTestResponse {
  // quiz
  correct?: boolean;
  correct_answer?: string;
  explanation?: string;
  score?: number;
  // pronunciation / interpretation / conversation
  transcription?: string;
  feedback?: string;
  phrase?: string;
  ai_response?: string;
  history?: { role: string; content: string }[];
  // result
  level?: string;
  level_label?: string;
  final_score?: number;
  breakdown?: Record<string, number>;
}
