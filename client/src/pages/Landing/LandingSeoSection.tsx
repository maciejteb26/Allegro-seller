import { Check } from 'lucide-react';
import { SEO_BENEFITS } from './constants';

export function LandingSeoSection() {
  return (
    <section id="seo" className="border-t border-stone-200 bg-gradient-to-b from-brand-50/50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">SEO Allegro</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              Tytuły i opisy, które pomagają w wyszukiwarce Allegro
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              szybkiewystawianie.pl generuje treści według reguł platformy — nie ogólny tekst marketingowy,
              ale oferta zoptymalizowana pod algorytm wyszukiwania i katalog produktów.
            </p>

            <ul className="mt-8 space-y-3">
              {SEO_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-ink-muted">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Przykład wygenerowanego tytułu</p>
            <p className="mt-3 rounded-xl bg-surface-muted p-4 font-medium text-ink">
              Zawieszenie pneumatyczne Fiat Ducato 1994-2023 tylne nowe
            </p>
            <p className="mt-2 text-right text-xs text-ink-faint">58 / 75 znaków · tryb AI</p>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">Fragment opisu SEO</p>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted">
              <p>
                Kompletne zawieszenie pneumatyczne do Fiata Ducato — gotowe do montażu,
                sprawdzone pod kątem kompatybilności z modelem 1994–2023.
              </p>
              <p>
                Stan: nowy. EAN: 5906476065534. Opakowanie oryginalne. Dostawa kurierem.
                Oferta powiązana z produktem z katalogu Allegro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
