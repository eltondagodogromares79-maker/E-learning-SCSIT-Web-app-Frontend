const ACCESS_TOKEN_KEY = 'scsit_access_token';
const REFRESH_TOKEN_KEY = 'scsit_refresh_token';

function hasWindow() {
  return typeof window !== 'undefined';
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(access?: string | null, refresh?: string | null) {
    if (!hasWindow()) return;
    if (access) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    }
    if (refresh) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  },
  clear() {
    if (!hasWindow()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
