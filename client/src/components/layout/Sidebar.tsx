import { Link, NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Package, PlugZap, Settings, ShoppingCart, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/', label: 'Strona główna', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/listings', label: 'Ogłoszenia', icon: Package },
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
    <aside className="flex h-full w-60 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <Link to="/" className="text-lg font-bold text-white hover:text-amber-400">
          Allegro Seller
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
