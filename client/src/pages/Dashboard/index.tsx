import { Package, PlugZap, TrendingUp, Eye, Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/dashboard.api';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { StatCard } from './StatCard';

const TODAY_LABEL_FORMAT = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function todayLabel() {
  const label = TODAY_LABEL_FORMAT.format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });

  const firstName = user?.name?.split(' ')[0] ?? 'Użytkowniku';

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-extrabold text-ink tracking-tight">
            Witaj, {firstName}! 👋
          </h1>
          <p className="text-sm text-ink-muted mt-1">{todayLabel()}</p>
        </div>
        <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm">
          <Link to="/imports">+ Nowe ogłoszenie</Link>
        </Button>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Aktywne ogłoszenia"
          value={data?.activeListings ?? 0}
          icon={Package}
          trend={data?.activeListings ? `+${data.activeListings} łącznie` : undefined}
        />
        <StatCard
          label="Połączone platformy"
          value={data?.listingsByPlatform?.length ?? 0}
          icon={PlugZap}
          sub={
            (data?.listingsByPlatform?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-primary-600 text-white text-[9px] font-bold">AL</span>
                Allegro ✓
              </span>
            ) : null
          }
        />
        <StatCard
          label="Ogłoszenia łącznie"
          value={data?.totalListings ?? 0}
          icon={TrendingUp}
          trend="od początku"
          trendPositive={false}
        />
      </div>

      {/* Recent listings */}
      <div className="bg-white border border-warm-200 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-base font-bold text-ink">Ostatnie ogłoszenia</h2>
          <Link
            to="/listings"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Zobacz wszystkie →
          </Link>
        </div>

        {data?.recentListings?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 text-ink-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6 text-left">Tytuł</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentListings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-t border-warm-100 hover:bg-warm-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-6">
                      <Link to="/listings" className="font-medium text-ink hover:text-primary-600 transition-colors">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={listing.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm-50 mb-4">
              <Package className="h-6 w-6 text-ink-muted" />
            </div>
            <p className="text-sm text-ink-muted">Nie masz jeszcze żadnych ogłoszeń</p>
            <Button asChild className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold" size="sm">
              <Link to="/imports">Import z Excel →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Allegro stats */}
      {((data?.allegro?.visitsCount ?? 0) > 0 || (data?.allegro?.watchersCount ?? 0) > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary-600 text-white text-[10px] font-bold">AL</span>
            <h2 className="text-base font-bold text-ink">Statystyki Allegro</h2>
            <span className="text-sm font-normal text-ink-muted">· ostatnie 30 dni</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              label="Wyświetlenia"
              value={data?.allegro?.visitsCount ?? 0}
              icon={Eye}
              trend="↗ +18%"
            />
            <StatCard
              label="Obserwujący"
              value={data?.allegro?.watchersCount ?? 0}
              icon={Heart}
              trend="↗ +5%"
            />
            <StatCard
              label="Sprzedane sztuki"
              value={data?.allegro?.soldCount ?? 0}
              icon={ShoppingBag}
              trend="↗ +12%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
