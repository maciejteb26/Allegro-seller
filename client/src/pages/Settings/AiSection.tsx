import { useQuery } from '@tanstack/react-query';
import { Bot, Sparkles } from 'lucide-react';
import { getAiSettings } from '@/api/settings.api';

const MODE_LABELS: Record<string, { label: string; tone: string; hint: string }> = {
  AI: {
    label: 'Anthropic Claude — aktywne',
    tone: 'bg-green-50 text-green-800 border-green-200',
    hint: 'Generowanie SEO i parser ogłoszeń używają prawdziwego API.',
  },
  MOCK: {
    label: 'Tryb demonstracyjny (AI mock)',
    tone: 'bg-blue-50 text-blue-800 border-blue-200',
    hint: 'Działa bez klucza API — wyniki symulowane. Dodaj ANTHROPIC_API_KEY do server/.env.',
  },
  OFF: {
    label: 'Wyłączone — tylko reguły',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    hint: 'Ustaw ANTHROPIC_API_KEY lub AI_MOCK=true w server/.env.',
  },
};

export default function AiSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'ai'],
    queryFn: getAiSettings,
  });

  const mode = data?.mode ?? 'OFF';
  const info = MODE_LABELS[mode] ?? MODE_LABELS.OFF;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Sztuczna inteligencja</h2>
      <div className={`rounded-2xl border p-5 shadow-sm ${info.tone}`}>
        <div className="flex items-start gap-3">
          {mode === 'AI' ? <Sparkles className="h-5 w-5 shrink-0 mt-0.5" /> : <Bot className="h-5 w-5 shrink-0 mt-0.5" />}
          <div className="space-y-2">
            <p className="font-semibold">{isLoading ? 'Sprawdzanie…' : info.label}</p>
            <p className="text-sm opacity-90">{info.hint}</p>
            {data && (
              <p className="text-xs opacity-75">
                Model: {data.model} · Funkcje: {data.features.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-800">Konfiguracja w server/.env:</p>
        <code className="block text-xs bg-white border rounded px-3 py-2">ANTHROPIC_API_KEY=sk-ant-...</code>
        <code className="block text-xs bg-white border rounded px-3 py-2">ANTHROPIC_MODEL=claude-haiku-4-5-20251001</code>
        <code className="block text-xs bg-white border rounded px-3 py-2">AI_MOCK=true</code>
      </div>
    </section>
  );
}
