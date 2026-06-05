import { Layers, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { FEATURES } from './constants';

const ICONS = {
  layers: Layers,
  sparkles: Sparkles,
  shield: Shield,
  trending: TrendingUp,
} as const;

export function LandingFeatures() {
  return (
    <section id="funkcje" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400/90">Funkcje</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Zbudowane pod handel częściami
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Nie ogólny marketplace builder — narzędzie dla warsztatów, handlarzy i rozbiórek.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <li
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 transition-colors hover:border-amber-500/30"
              >
                <span className="inline-flex rounded-lg bg-amber-500/15 p-2.5 text-amber-400 ring-1 ring-amber-500/25">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
