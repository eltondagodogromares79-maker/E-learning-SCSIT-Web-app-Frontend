export interface AuthSession {
  user_id: string;
  role: 'student' | 'teacher' | 'principal' | 'dean' | 'admin';
  access_token: string;
  expires_at: string;
}
