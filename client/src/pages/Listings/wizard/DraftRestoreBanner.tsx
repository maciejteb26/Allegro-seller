import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardDraftMeta } from './draftStorage';

interface Props {
  draft: WizardDraftMeta;
  onDismiss: () => void;
}

function formatSavedAt(date: Date): string {
  return date.toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DraftRestoreBanner({ draft, onDismiss }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-900">Szkic został przywrócony</p>
          <p className="mt-0.5 text-xs text-green-800">
            {draft.title ? `„${draft.title}” · ` : ''}
            krok {draft.step + 1} · zapis {formatSavedAt(draft.savedAt)}
            {draft.imagesOmitted && ' · zdjęcia wymagają ponownego dodania'}
          </p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onDismiss} className="shrink-0">
        <X className="mr-1 h-3.5 w-3.5" />
        Zacznij od nowa
      </Button>
    </div>
  );
}
