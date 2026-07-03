import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlugZap,
  Settings,
  ShoppingCart,
  LogOut,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/imports', label: 'Import Excel', icon: FileSpreadsheet, featured: true },
  { to: '/listings', label: 'Ogłoszenia', icon: Package },
  { to: '/clients', label: 'Klienci', icon: Building2 },
  { to: '/platforms', label: 'Allegro', icon: PlugZap },
  { to: '/orders', label: 'Zamówienia', icon: ShoppingCart },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="flex h-full w-64 flex-col border-r border-warm-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-warm-200 px-4 gap-2.5">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5"
          onClick={onNavigate}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white tracking-tight">
            AS
          </span>
          <span className="truncate text-sm font-bold text-ink tracking-tight">
            szybkiewystawianie<span className="text-primary-600">.pl</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 flex flex-col gap-0.5" aria-label="Panel">
        {NAV_ITEMS.map(({ to, label, icon: Icon, featured }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-ink-muted hover:bg-warm-50 hover:text-ink',
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {featured && (
              <span className="text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-full tracking-wide">
                START
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-warm-200 p-3">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] hover:bg-warm-50 transition-colors mb-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink leading-tight">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-ink-muted hover:bg-warm-50 hover:text-ink transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
