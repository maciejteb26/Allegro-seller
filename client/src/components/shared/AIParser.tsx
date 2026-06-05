import { useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseListingInput, ParsedListingData } from '@/api/ai-parser.api';
import { InternalCategory } from '@/types';
import { WizardData } from '@/pages/Listings/wizard/types';
import { AI_PARSER_EXAMPLES } from '@/pages/Listings/wizard/constants';
import { mapAiParsedToWizard } from '@/pages/Listings/wizard/utils/mapAiParsed';
import { resolveVehicleFromParsed } from '@/pages/Listings/wizard/utils/resolveVehicleFromParsed';
import { AIParserPreview } from './AIParserPreview';

interface Props {
  categories: InternalCategory[];
  vehicleType: WizardData['vehicleType'];
  onApply: (patch: Partial<WizardData>) => void;
}

export function AIParser({ categories, vehicleType, onApply }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedListingData | null>(null);
  const [lastTitle, setLastTitle] = useState<string | undefined>();

  async function handleParse() {
    const text = input.trim();
    if (text.length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const result = await parseListingInput(text);
      const patch = mapAiParsedToWizard(result, categories, text);
      const vehiclePatch = await resolveVehicleFromParsed(result, vehicleType);

      const fullPatch: Partial<WizardData> = {
        ...patch,
        ...vehiclePatch,
        vehicleType: vehiclePatch.vehicleType ?? vehicleType,
      };
      setParsed(result);
      setLastTitle(fullPatch.title);
      onApply(fullPatch);
    } catch {
      setError('Nie udało się przeanalizować opisu. Spróbuj ponownie lub uzupełnij pola ręcznie.');
      setParsed(null);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleParse();
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm">
      <div className="border-b border-primary-100 bg-primary-50/80 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <div>
            <h3 className="text-sm font-semibold text-primary-900">Opisz część — AI uzupełni formularz</h3>
            <p className="text-xs text-primary-700">
              Wpisz opis własnymi słowami. System rozpozna kategorię, pojazd, stan i wygeneruje tytuł.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <label htmlFor="ai-parser-input" className="mb-1.5 block text-sm font-medium text-gray-700">
            Opis części
          </label>
          <textarea
            id="ai-parser-input"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="np. Lampa tylna Suzuki Samurai 1990 prawa strona, używana, oryginalna, bez pęknięć..."
            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-400">Ctrl+Enter — szybkie parsowanie</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Przykłady:</span>
          {AI_PARSER_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => setInput(example)}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50"
            >
              {example.length > 42 ? `${example.slice(0, 42)}…` : example}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => void handleParse()}
          disabled={loading || input.trim().length < 3}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Analizuję opis…' : 'Analizuj i wypełnij formularz'}
        </Button>

        {parsed && !loading && (
          <AIParserPreview parsed={parsed} categories={categories} generatedTitle={lastTitle} />
        )}
      </div>
    </section>
  );
}
