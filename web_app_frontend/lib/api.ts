import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { loadingBus } from '@/lib/loadingBus';
import { tokenStorage } from '@/lib/tokenStorage';
import { env } from '@/lib/env';

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<(value: void) => void> = [];

function resolveQueue() {
  refreshQueue.forEach((cb) => cb());
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => {
    loadingBus.decrement();
    return response;
  },
  async (error: AxiosError) => {
    loadingBus.decrement();
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthError = status === 401;
    const url = originalRequest?.url ?? '';
    const isRefreshEndpoint = url.includes('/api/users/refresh/');
    const isLoginEndpoint = url.includes('/api/users/login/');
    const isLogoutEndpoint = url.includes('/api/users/logout/');
    const isVerifyEndpoint = url.includes('/api/users/verify/');
    const isAuthEndpoint = isLoginEndpoint || isLogoutEndpoint || isRefreshEndpoint || isVerifyEndpoint;

    if (!originalRequest || !isAuthError || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      await new Promise<void>((resolve) => refreshQueue.push(resolve));
      return api(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      const refreshPayload = refreshToken ? { refresh_token: refreshToken } : undefined;
      const refreshResponse = await api.post('/api/users/refresh/', refreshPayload);
      const responseData = refreshResponse?.data as { access_token?: string; refresh_token?: string } | undefined;
      if (responseData?.access_token || responseData?.refresh_token) {
        tokenStorage.setTokens(responseData?.access_token ?? null, responseData?.refresh_token ?? null);
      }
      resolveQueue();
      return api(originalRequest);
    } catch (refreshError) {
      tokenStorage.clear();
      refreshQueue = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    loadingBus.increment();
    return config;
  },
  (error) => {
    loadingBus.decrement();
    return Promise.reject(error);
  }
);
