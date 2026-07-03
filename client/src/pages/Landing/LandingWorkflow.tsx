import { FileSpreadsheet, Rocket, Search, Sparkles } from 'lucide-react';
import { WORKFLOW_STEPS } from './constants';

const ICONS = {
  upload: FileSpreadsheet,
  search: Search,
  sparkles: Sparkles,
  rocket: Rocket,
} as const;

export function LandingWorkflow() {
  return (
    <section id="jak-to-dziala" className="border-y border-warm-200 bg-surface-muted py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Proces</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            Od arkusza do oferty na Allegro w 4 krokach
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Cały flow zaprojektowany pod sprzedawców B2B — hurtowe wystawianie bez chaosu w arkuszu.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li
                key={item.step}
                className="relative rounded-2xl border border-warm-200 bg-white p-6 shadow-soft"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="absolute right-5 top-5 font-display text-3xl font-bold text-warm-300">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.desc}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
