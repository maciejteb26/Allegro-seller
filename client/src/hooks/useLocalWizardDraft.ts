import { useCallback, useSyncExternalStore } from 'react';
import { WIZARD_DRAFT_KEY } from '@/pages/Listings/wizard/constants';
import {
  clearWizardDraft,
  loadDraftMeta,
  WIZARD_DRAFT_CHANGED_EVENT,
  WizardDraftMeta,
} from '@/pages/Listings/wizard/draftStorage';

let cachedRaw: string | null | undefined;
let cachedMeta: WizardDraftMeta | null = null;

function readSnapshot(): WizardDraftMeta | null {
  const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
  if (raw === cachedRaw) return cachedMeta;

  cachedRaw = raw;
  cachedMeta = raw ? loadDraftMeta() : null;
  return cachedMeta;
}

function invalidateCache(): void {
  cachedRaw = undefined;
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => {
    invalidateCache();
    onStoreChange();
  };
  window.addEventListener(WIZARD_DRAFT_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(WIZARD_DRAFT_CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useLocalWizardDraft() {
  const meta = useSyncExternalStore(subscribe, readSnapshot, () => null);

  const dismiss = useCallback(() => {
    clearWizardDraft();
    invalidateCache();
  }, []);

  return { meta, dismiss };
}
