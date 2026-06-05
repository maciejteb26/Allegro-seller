import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { getMe } from '@/api/auth.api';
import LoginPage from '@/pages/Auth/Login';
import RegisterPage from '@/pages/Auth/Register';
import LandingPage from '@/pages/Landing';
import DashboardPage from '@/pages/Dashboard';
import ListingsPage from '@/pages/Listings';
import NewListingPage from '@/pages/Listings/New';
import EditListingPage from '@/pages/Listings/Edit';
import PlatformsPage from '@/pages/Platforms';
import OrdersPage from '@/pages/Orders';
import SettingsPage from '@/pages/Settings';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

function AuthLoader({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => { if (!cancelled) setUser(user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthLoader>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listings/new" element={<NewListingPage />} />
                <Route
                  path="/listings/:id/edit"
                  element={<ErrorBoundary><EditListingPage /></ErrorBoundary>}
                />
                <Route path="/platforms" element={<ErrorBoundary><PlatformsPage /></ErrorBoundary>} />
                <Route path="/orders" element={<ErrorBoundary><OrdersPage /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
              </Route>
            </Route>
          </Routes>
        </AuthLoader>
      </BrowserRouter>
    </ToastProvider>
  );
}
