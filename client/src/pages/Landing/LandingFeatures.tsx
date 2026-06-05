import { FileSpreadsheet, Layers, Search, Sparkles } from 'lucide-react';
import { FEATURES } from './constants';

const ICONS = {
  spreadsheet: FileSpreadsheet,
  catalog: Search,
  seo: Sparkles,
  wizard: Layers,
} as const;

export function LandingFeatures() {
  return (
    <section id="funkcje" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Funkcje</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            Wszystko, czego potrzebujesz do sprzedaży na Allegro
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Hurtowy import, katalog produktów Allegro i pojedynczy kreator ogłoszeń — w jednym panelu.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <li
                key={feature.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft transition-shadow hover:shadow-card"
              >
                <span className="inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
