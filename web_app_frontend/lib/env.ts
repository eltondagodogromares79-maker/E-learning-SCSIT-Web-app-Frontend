const isDev = process.env.NODE_ENV !== 'production';

const requirePublicEnv = (value: string | undefined, key: string, fallback?: string) => {
  if (value && value.trim()) return value;
  if (isDev && fallback) return fallback;
  throw new Error(`Missing required public env var: ${key}`);
};

export const env = {
  API_BASE_URL: requirePublicEnv(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    'NEXT_PUBLIC_API_BASE_URL',
    'http://localhost:8000'
  ),
  NOTIFICATIONS_WS_URL: requirePublicEnv(
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL,
    'NEXT_PUBLIC_NOTIFICATIONS_WS_URL',
    'ws://localhost:8000/ws/notifications/'
  ),
  CHAT_WS_URL: requirePublicEnv(
    process.env.NEXT_PUBLIC_CHAT_WS_URL,
    'NEXT_PUBLIC_CHAT_WS_URL',
    'ws://localhost:8080/ws/chat/'
  ),
};
