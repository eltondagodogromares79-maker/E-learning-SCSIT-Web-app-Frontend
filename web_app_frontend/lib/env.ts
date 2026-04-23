const appTarget = (process.env.NEXT_PUBLIC_APP_TARGET ?? 'local').trim().toLowerCase();

const selectTargetUrl = (local: string | undefined, remote: string | undefined, fallback: string): string => {
  const preferred = appTarget === 'remote' ? remote : local;
  if (preferred && preferred.trim()) return preferred.trim();
  // Always fall back gracefully — env vars must be set on the deployment platform
  return fallback;
};

export const env = {
  APP_TARGET: appTarget,
  API_BASE_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL,
    process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE,
    'http://localhost:8000'
  ),
  NOTIFICATIONS_WS_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_LOCAL,
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_REMOTE,
    'ws://localhost:8000/ws/notifications/'
  ),
  CHAT_WS_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_CHAT_WS_URL_LOCAL,
    process.env.NEXT_PUBLIC_CHAT_WS_URL_REMOTE,
    'ws://localhost:8080/ws/chat/'
  ),
};
