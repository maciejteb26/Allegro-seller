import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function LandingCta() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-14 text-center shadow-card sm:px-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            {user ? 'Wgraj pierwszą listę produktów' : 'Zacznij wystawiać na Allegro szybciej'}
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-primary-100">
            {user
              ? 'Import Excel → katalog Allegro → SEO → publikacja. Wszystko w jednym panelu.'
              : 'Załóż konto, podłącz Allegro i przetestuj import z własnego arkusza — bez karty kredytowej.'}
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-8 h-12 bg-white px-8 text-base font-semibold text-primary-700 hover:bg-primary-50"
          >
            <Link to={user ? '/imports' : '/register'}>
              {user ? 'Przejdź do importu' : 'Utwórz konto za darmo'}
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
    <footer className="border-t border-stone-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div>
          <p className="font-display font-semibold text-ink">szybkiewystawianie.pl</p>
          <p className="mt-1 text-sm text-ink-faint">
            Wystawianie ofert na Allegro z Excela i generowaniem SEO
          </p>
        </div>
        <nav className="flex gap-6 text-sm text-ink-muted" aria-label="Stopka">
          <Link to="/login" className="hover:text-primary-600">Logowanie</Link>
          <Link to="/register" className="hover:text-primary-600">Rejestracja</Link>
          <a href="#seo" className="hover:text-primary-600">SEO Allegro</a>
        </nav>
        <p className="text-sm text-ink-faint">© {new Date().getFullYear()} szybkiewystawianie.pl</p>
      </div>
    </footer>
  );
}
