import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Wgraj plik' },
  { num: 2, label: 'Szukaj produkty' },
  { num: 3, label: 'Generuj SEO' },
  { num: 4, label: 'Wystaw' },
];

interface StepperProps {
  currentStep: number;
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="bg-white border border-warm-200 rounded-xl px-7 py-5 shadow-card mb-5">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done = step.num < currentStep;
          const active = step.num === currentStep;
          const last = idx === STEPS.length - 1;

          return (
            <div key={step.num} className={cn('flex items-center', !last && 'flex-1')}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors',
                    done && 'bg-primary-600 text-white',
                    active && 'bg-primary-600 text-white ring-4 ring-primary-50',
                    !done && !active && 'bg-warm-100 text-ink-muted',
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-ink-muted font-mono tracking-wider uppercase">
                    KROK {step.num}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      active ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
              {!last && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 rounded-full transition-colors',
                    done ? 'bg-primary-600' : 'bg-warm-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
