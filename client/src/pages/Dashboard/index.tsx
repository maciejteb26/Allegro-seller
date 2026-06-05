import { Package, PlugZap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/dashboard.api';

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Witaj, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Oto podsumowanie Twojej aktywności</p>
        </div>
        <Button asChild>
          <Link to="/listings/new">+ Dodaj ogłoszenie</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Aktywne ogłoszenia" value={data?.activeListings ?? 0} icon={Package} />
        <StatCard label="Połączone platformy" value={data?.listingsByPlatform?.length ?? 0} icon={PlugZap} />
        <StatCard label="Ogłoszenia łącznie" value={data?.totalListings ?? 0} icon={TrendingUp} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie ogłoszenia</h2>
        {data?.recentListings?.length ? (
          <div className="space-y-2">
            {data.recentListings.map((listing) => (
              <Link key={listing.id} to="/listings" className="block rounded border p-3 text-sm hover:bg-gray-50">
                {listing.title}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">Nie masz jeszcze żadnych ogłoszeń</p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/listings/new">Dodaj pierwsze ogłoszenie</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
