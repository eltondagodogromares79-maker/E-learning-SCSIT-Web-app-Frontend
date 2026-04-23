const isDev = process.env.NODE_ENV !== 'production';
const appTarget = (process.env.NEXT_PUBLIC_APP_TARGET ?? 'local').trim().toLowerCase();

const requirePublicEnv = (value: string | undefined, key: string, fallback?: string) => {
  if (value && value.trim()) return value;
  if (isDev && fallback) return fallback;
  throw new Error(`Missing required public env var: ${key}`);
};

const selectTargetUrl = ({
  local,
  remote,
  key,
  fallback,
}: {
  local: string | undefined;
  remote: string | undefined;
  key: string;
  fallback?: string;
}) => {
  const preferred = appTarget === 'remote' ? remote : local;
  return requirePublicEnv(preferred, key, fallback);
};

export const env = {
  APP_TARGET: appTarget,
  API_BASE_URL: selectTargetUrl(
    {
      local: process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL,
      remote: process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE,
      key: 'NEXT_PUBLIC_API_BASE_URL_LOCAL/NEXT_PUBLIC_API_BASE_URL_REMOTE',
      fallback: 'http://localhost:8000',
    }
  ),
  NOTIFICATIONS_WS_URL: selectTargetUrl(
    {
      local: process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_LOCAL,
      remote: process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_REMOTE,
      key: 'NEXT_PUBLIC_NOTIFICATIONS_WS_URL_LOCAL/NEXT_PUBLIC_NOTIFICATIONS_WS_URL_REMOTE',
      fallback: 'ws://localhost:8000/ws/notifications/',
    }
  ),
  CHAT_WS_URL: selectTargetUrl(
    {
      local: process.env.NEXT_PUBLIC_CHAT_WS_URL_LOCAL,
      remote: process.env.NEXT_PUBLIC_CHAT_WS_URL_REMOTE,
      key: 'NEXT_PUBLIC_CHAT_WS_URL_LOCAL/NEXT_PUBLIC_CHAT_WS_URL_REMOTE',
      fallback: 'ws://localhost:8080/ws/chat/',
    }
  ),
};
