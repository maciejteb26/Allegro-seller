import { Link } from 'react-router-dom';
import { FileEdit, Package, Trash2 } from 'lucide-react';
import { WizardDraftMeta } from '@/pages/Listings/wizard/draftStorage';
import { WIZARD_STEPS } from '@/pages/Listings/wizard/constants';
import { CONDITION_LABELS } from '@/pages/Listings/wizard/constants';

interface Props {
  draft: WizardDraftMeta;
  onDismiss: () => void;
}

export function LocalWizardDraftRow({ draft, onDismiss }: Props) {
  const stepLabel = WIZARD_STEPS[draft.step]?.label ?? `Krok ${draft.step + 1}`;
  const title = draft.title?.trim() || 'Nowe ogłoszenie (szkic)';
  const savedAt =
    draft.savedAt instanceof Date ? draft.savedAt : new Date(draft.savedAt as unknown as string);
  const savedAtLabel = Number.isNaN(savedAt.getTime())
    ? '—'
    : savedAt.toLocaleString('pl-PL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

  function handleDismiss() {
    if (!confirm('Usunąć zapisany szkic? Tej operacji nie można cofnąć.')) return;
    onDismiss();
  }

  return (
    <tr className="border-b border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-200 bg-amber-100">
          <FileEdit className="h-5 w-5 text-amber-700" />
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 line-clamp-1">{title}</p>
        <p className="mt-0.5 text-xs text-amber-800">
          Szkic w przeglądarce · {stepLabel} · {savedAtLabel}
        </p>
      </td>
      <td className="px-4 py-3 text-gray-700">
        {draft.condition ? CONDITION_LABELS[draft.condition] ?? '—' : '—'}
      </td>
      <td className="px-4 py-3 font-semibold text-gray-900">
        {draft.basePrice != null ? `${Number(draft.basePrice).toFixed(2)} PLN` : '—'}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          <Package className="h-3 w-3" />
          W trakcie
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Link
            to="/listings/new"
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            Kontynuuj
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1.5 text-red-500 hover:bg-red-50"
            title="Usuń szkic"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
