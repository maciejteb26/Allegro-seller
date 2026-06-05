import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function LandingNav() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-slate-950">
            AL
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Allegro Seller
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="#platformy" className="transition-colors hover:text-white">
            Platformy
          </a>
          <a href="#funkcje" className="transition-colors hover:text-white">
            Funkcje
          </a>
          <a href="#jak-to-dziala" className="transition-colors hover:text-white">
            Jak to działa
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Button asChild className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400">
              <Link to="/dashboard">Przejdź do panelu</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-slate-300 hover:bg-white/5 hover:text-white">
                <Link to="/login">Zaloguj</Link>
              </Button>
              <Button asChild className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400">
                <Link to="/register">Zacznij za darmo</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
