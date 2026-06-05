import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { STATS } from './constants';

export function LandingHero() {
  const user = useAuthStore((s) => s.user);
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-primary-600/25 blur-3xl" />
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Części samochodowe · Allegro
            </p>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Wystaw część na Allegro.
              <span className="mt-1 block bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                Szybciej i prościej.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              Allegro Seller to panel do wystawiania części samochodowych na Allegro — od opisu
              z AI po publikację bez przepisywania ogłoszeń.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 bg-amber-500 px-6 text-base font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    <Link to="/dashboard">
                      Otwórz panel
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link to="/listings/new">Nowe ogłoszenie</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 bg-amber-500 px-6 text-base font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    <Link to="/register">
                      Utwórz konto
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link to="/login">Mam już konto</Link>
                  </Button>
                </>
              )}
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              {STATS.map((item) => (
                <div key={item.label}>
                  <dt className="font-display text-2xl font-bold text-white">{item.value}</dt>
                  <dd className="mt-1 text-xs text-slate-500 sm:text-sm">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-transparent to-primary-600/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs text-slate-500">Nowe ogłoszenie — krok 3/3</span>
              </div>

              <div className="space-y-4 p-5">
                <div className="rounded-lg border border-white/10 bg-slate-800/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
                    Podsumowanie
                  </p>
                  <p className="mt-2 font-medium text-white">
                    Lampa tylna Suzuki Samurai 1990 prawa używana
                  </p>
                  <div className="mt-3 flex gap-4 text-sm text-slate-400">
                    <span>używana</span>
                    <span>·</span>
                    <span>3 zdjęcia</span>
                    <span>·</span>
                    <span className="font-semibold text-white">100 PLN</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Allegro'].map((name) => (
                    <span
                      key={name}
                      className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200"
                    >
                      {name} ✓
                    </span>
                  ))}
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
                </div>
                <p className="text-center text-xs text-slate-500">Publikacja na platformach…</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
