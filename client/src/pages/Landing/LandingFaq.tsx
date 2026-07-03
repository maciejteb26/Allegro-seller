import { useState } from 'react';
import { FAQ } from './constants';

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="border-t border-warm-200 bg-surface-muted py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-ink">Najczęstsze pytania</h2>
        <p className="mt-3 text-center text-ink-muted">
          Odpowiedzi o wystawianiu ofert, imporcie Excel i SEO na Allegro.
        </p>

        <div className="mt-10 space-y-3">
          {FAQ.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.q} className="overflow-hidden rounded-[10px] border border-warm-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15.5px] font-semibold text-ink"
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <span className="text-xl leading-none text-primary-600">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-ink-muted">{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
