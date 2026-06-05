import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Nie próbuj refreshować dla /auth/me i /auth/refresh — pozwól im failować
    const isAuthCheck = original.url?.includes('/auth/me') || original.url?.includes('/auth/refresh');
    if (isAuthCheck) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        return apiClient(original);
      } catch {
        // Nie rób window.location.href — pozwól ProtectedRoute obsłużyć redirect
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
