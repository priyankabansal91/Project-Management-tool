import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const IS_DEV = (import.meta as any).env?.DEV === true;

api.interceptors.request.use((config) => {
  const { accessToken, user } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // Only send dev persona header in local development — never in production builds
  if (IS_DEV && user?.id) config.headers['x-dev-user-id'] = user.id;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = data.data.access_token;
        useAuthStore.getState().setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
