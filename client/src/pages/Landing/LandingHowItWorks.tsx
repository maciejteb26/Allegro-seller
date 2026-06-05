import { STEPS } from './constants';

export function LandingHowItWorks() {
  return (
    <section id="jak-to-dziala" className="border-t border-white/5 bg-slate-900/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-amber-400/90">
          Proces
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-white sm:text-4xl">
          Od opisu do sprzedaży w trzech krokach
        </h2>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((item, index) => (
            <li key={item.step} className="relative">
              {index < STEPS.length - 1 && (
                <span
                  className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-amber-500/50 to-transparent md:block"
                  aria-hidden
                />
              )}
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
                <span className="font-display text-4xl font-bold text-amber-500/40">{item.step}</span>
                <h3 className="mt-3 font-display text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
