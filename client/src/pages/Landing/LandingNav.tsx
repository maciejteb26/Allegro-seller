import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

const LINKS = [
  { href: '#jak-to-dziala', label: 'Jak to działa' },
  { href: '#funkcje', label: 'Funkcje' },
  { href: '#seo', label: 'SEO Allegro' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNav() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white shadow-sm">
            AS
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            szybkiewystawianie.pl
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex" aria-label="Główne">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-primary-600">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <Button asChild className="bg-primary-600 font-semibold hover:bg-primary-700">
              <Link to="/dashboard">Panel</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-ink-muted hover:text-ink">
                <Link to="/login">Zaloguj</Link>
              </Button>
              <Button asChild className="bg-primary-600 font-semibold hover:bg-primary-700">
                <Link to="/register">Zacznij za darmo</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-stone-200 bg-white px-4 py-4 md:hidden" aria-label="Mobilne">
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-ink-muted hover:text-primary-600"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-stone-100 pt-4">
              {user ? (
                <Button asChild className="bg-primary-600">
                  <Link to="/dashboard">Panel</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">Zaloguj</Link>
                  </Button>
                  <Button asChild className="bg-primary-600">
                    <Link to="/register">Zacznij za darmo</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
