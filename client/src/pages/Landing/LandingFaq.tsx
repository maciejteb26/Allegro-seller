import { FAQ } from './constants';

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-stone-200 bg-surface-muted py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-ink">Częste pytania</h2>
        <p className="mt-3 text-center text-ink-muted">
          Odpowiedzi o wystawianiu ofert, imporcie Excel i SEO na Allegro.
        </p>

        <dl className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
              <dt className="font-semibold text-ink">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
