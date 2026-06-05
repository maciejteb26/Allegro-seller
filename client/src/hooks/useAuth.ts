import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { getMe } from '../api/auth.api';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser, setLoading]);

  return { user, isLoading };
}
