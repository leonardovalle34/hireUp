export interface IUser {
  name: string;
  email: string;
  created_at: string;
  plan: string;
  lessons_today: number;
  can_take_lesson: boolean;
  limit: number;
  remaining: number;
}
