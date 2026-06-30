export interface TutorResponse {
  transcription: string;
  tutor_response: string;
  tutor_response_clean: string;
  tutor_name: string;
  history: { role: string; content: string }[];
}
