import { useQuery } from '@tanstack/react-query';
import { Bot, Sparkles } from 'lucide-react';
import { getAiSettings } from '@/api/settings.api';

export function AiStatusBanner() {
  const { data } = useQuery({ queryKey: ['settings', 'ai'], queryFn: getAiSettings });

  if (!data) return null;

  if (data.mode === 'AI') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <Sparkles className="h-4 w-4 shrink-0" />
        AI aktywne — tytuły i opisy generowane przez Claude ({data.model})
      </div>
    );
  }

  if (data.mode === 'MOCK') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Bot className="h-4 w-4 shrink-0" />
        Tryb AI mock — wyniki symulowane. Dodaj <code className="mx-1 rounded bg-white px-1">ANTHROPIC_API_KEY</code> do server/.env.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Bot className="h-4 w-4 shrink-0" />
      AI wyłączone — używane są reguły. Ustaw klucz API lub <code className="mx-1 rounded bg-white px-1">AI_MOCK=true</code>.
    </div>
  );
}
