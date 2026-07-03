import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export function LandingCta() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="py-20 text-center sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          {user ? 'Wgraj pierwszą listę produktów' : 'Gotowy, by oszczędzić godziny?'}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-ink-muted">
          {user
            ? 'Import Excel → katalog Allegro → SEO → publikacja. Wszystko w jednym panelu.'
            : 'Wgraj pierwszy plik i zobacz ogłoszenia na Allegro w kilka minut.'}
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 h-12 bg-primary-600 px-8 text-base font-semibold hover:bg-primary-700"
        >
          <Link to={user ? '/imports' : '/register'}>
            {user ? 'Przejdź do importu' : 'Zacznij za darmo'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-warm-200 bg-white py-10">
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
        </nav>
        <p className="text-sm text-ink-faint">© {new Date().getFullYear()} szybkiewystawianie.pl</p>
      </div>
    </footer>
  );
}
