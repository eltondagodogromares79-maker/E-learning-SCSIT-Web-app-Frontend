const appTarget = process.env.NEXT_PUBLIC_APP_TARGET?.trim().toLowerCase();

if (!appTarget) {
  throw new Error("NEXT_PUBLIC_APP_TARGET is not defined");
}

const selectTargetUrl = (
  local: string | undefined,
  remote: string | undefined
): string => {
  const value = appTarget === "remote" ? remote : local;

  if (!value || !value.trim()) {
    throw new Error(
      `Missing environment variable for ${appTarget.toUpperCase()} target`
    );
  }

  return value.trim();
};

export const env = {
  APP_TARGET: appTarget,
  API_BASE_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL,
    process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE
  ),
  NOTIFICATIONS_WS_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_LOCAL,
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL_REMOTE
  ),
  CHAT_WS_URL: selectTargetUrl(
    process.env.NEXT_PUBLIC_CHAT_WS_URL_LOCAL,
    process.env.NEXT_PUBLIC_CHAT_WS_URL_REMOTE
  ),
};