import { SEO_PROMPT_MAX_LENGTH } from '@/api/clients.api';
import { Label } from '@/components/ui/label';

interface ClientSeoPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientSeoPromptField({ value, onChange }: ClientSeoPromptFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="client-seo-prompt">Własny prompt SEO (opcjonalnie)</Label>
        <span className="text-xs text-ink-muted">{value.length}/{SEO_PROMPT_MAX_LENGTH}</span>
      </div>
      <textarea
        id="client-seo-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, SEO_PROMPT_MAX_LENGTH))}
        rows={5}
        placeholder="Np. Pisz formalnym tonem. Podkreślaj kompatybilność z BMW i Mercedes. Nie używaj słowa „oryginał”."
        className="mt-1 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-ink"
      />
      <p className="mt-1 text-xs text-ink-muted">
        Dodatkowe instrukcje dla AI przy tłumaczeniu i generowaniu tytułu/opisu na Allegro.
      </p>
    </div>
  );
}
