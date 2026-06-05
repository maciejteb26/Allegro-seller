import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function LandingCta() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 px-8 py-14 text-center sm:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            {user ? 'Wróć do wystawiania części' : 'Gotowy, żeby wystawić pierwszą część?'}
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-slate-400">
            {user
              ? 'Kreator, AI Parser i publikacja na platformach czekają w panelu.'
              : 'Załóż konto i przejdź przez kreator — szkic zapisze się sam, zanim zdecydujesz o publikacji.'}
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-8 h-12 bg-amber-500 px-8 text-base font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Link to={user ? '/listings/new' : '/register'}>
              {user ? 'Dodaj ogłoszenie' : 'Rozpocznij za darmo'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Allegro Seller</p>
        <div className="flex gap-6">
          <Link to="/login" className="hover:text-slate-300">
            Logowanie
          </Link>
          <Link to="/register" className="hover:text-slate-300">
            Rejestracja
          </Link>
        </div>
      </div>
    </footer>
  );
}
