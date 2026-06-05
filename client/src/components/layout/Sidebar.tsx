import { Link, NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Package, PlugZap, Settings, ShoppingCart, LogOut, FileSpreadsheet, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/', label: 'Strona główna', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/listings', label: 'Ogłoszenia', icon: Package },
  { to: '/clients', label: 'Klienci', icon: Building2 },
  { to: '/imports', label: 'Import Excel', icon: FileSpreadsheet },
  { to: '/platforms', label: 'Allegro', icon: PlugZap },
  { to: '/orders', label: 'Zamówienia', icon: ShoppingCart },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-stone-200 bg-white">
      <div className="flex h-16 items-center border-b border-stone-100 px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink hover:text-primary-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
            AS
          </span>
          Allegro Seller
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Panel">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-stone-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
