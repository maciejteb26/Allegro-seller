import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

const HIGHLIGHTS = [
  'Import z Excela — setki produktów naraz',
  'Wyszukiwanie w katalogu Allegro po EAN',
  'Tytuł i opis SEO generowane przez AI',
];

const TRUST_BADGES = ['Bez karty', '14 dni za darmo', 'Anuluj kiedy chcesz'];

export function LandingHero() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="landing-blob pointer-events-none absolute -left-20 top-10 h-[28rem] w-[28rem]" />
      <div className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <Sparkles className="h-3.5 w-3.5" />
              Wystawianie ofert na Allegro · SEO · Excel
            </p>

            <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.1rem]">
              Z Excela na Allegro
              <span className="mt-1 block text-primary-600">z tytułem i opisem pod SEO</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Wgraj listę produktów, dopasuj do katalogu Allegro i wygeneruj oferty gotowe do
              wyszukiwarki — bez ręcznego przepisywania setek pozycji.
            </p>

            <ul className="mt-6 space-y-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <Button asChild size="lg" className="h-12 bg-primary-600 px-6 text-base font-semibold hover:bg-primary-700">
                    <Link to="/imports">
                      Importuj Excel
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 border-warm-300">
                    <Link to="/dashboard">Panel</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="h-12 bg-primary-600 px-6 text-base font-semibold hover:bg-primary-700">
                    <Link to="/register">
                      Utwórz konto
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 border-warm-300">
                    <Link to="/login">Mam konto</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {TRUST_BADGES.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 border-b border-warm-100 pb-4">
                <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-ink">Import · Zestawienie.xlsx</span>
                <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  10 pozycji
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { sig: 'D541', title: 'Przegroda pokojowa stelaż mobilny', seo: 'Przegroda pokojowa stelaż mobilny nowy', status: 'SEO ✓' },
                  { sig: 'D542', title: 'Ścianka działowa regulowana', seo: 'Ścianka działowa regulowana biała nowa', status: 'Katalog ✓' },
                ].map((row) => (
                  <div key={row.sig} className="rounded-xl bg-surface-muted p-3">
                    <div className="flex items-center justify-between text-xs text-ink-faint">
                      <span>{row.sig}</span>
                      <span className="rounded bg-white px-1.5 py-0.5 font-medium text-brand-700">{row.status}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink">{row.title}</p>
                    <p className="mt-1 truncate text-xs text-primary-700">{row.seo}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                <span className="text-sm font-medium text-primary-800">Generuj SEO dla wszystkich</span>
                <Sparkles className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
