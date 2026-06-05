import { PLATFORMS } from './constants';

export function LandingPlatforms() {
  return (
    <section id="platformy" className="border-y border-white/5 bg-slate-900/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-400/90">Integracje</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
          Twoje platformy, jeden panel
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Podłącz konta sprzedażowe i publikuj bez przełączania kart w przeglądarce.
        </p>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {PLATFORMS.map((name) => (
            <li
              key={name}
              className="rounded-xl border border-white/10 bg-slate-800/60 px-6 py-4 font-display text-lg font-semibold text-white transition-colors hover:border-amber-500/40 hover:bg-slate-800"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
