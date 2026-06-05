import { useCallback, useEffect, useRef, useState } from 'react';
import { WIZARD_DRAFT_DEBOUNCE_MS } from './constants';
import {
  clearWizardDraft,
  loadDraft,
  loadDraftMeta,
  saveWizardDraft,
  WizardDraftMeta,
} from './draftStorage';
import { WizardData, WIZARD_DEFAULTS } from './types';

interface Options {
  step: number;
  data: WizardData;
  onRestore: (step: number, data: WizardData) => void;
}

export function useWizardDraft({ step, data, onRestore }: Options) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [restoredDraft, setRestoredDraft] = useState<WizardDraftMeta | null>(null);
  const onRestoreRef = useRef(onRestore);
  const prevStepRef = useRef(step);
  onRestoreRef.current = onRestore;

  useEffect(() => {
    let cancelled = false;

    void loadDraft().then((draft) => {
      if (cancelled) return;
      if (draft) {
        onRestoreRef.current(draft.step, draft.data);
        setRestoredDraft(loadDraftMeta());
      }
      setIsHydrating(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isHydrating) return;

    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      void saveWizardDraft(step, data);
      return;
    }

    const timer = window.setTimeout(() => {
      void saveWizardDraft(step, data);
    }, WIZARD_DRAFT_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [step, data, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    const onLeave = () => {
      void saveWizardDraft(step, data);
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [step, data, isHydrating]);

  const dismissDraft = useCallback(() => {
    clearWizardDraft();
    setRestoredDraft(null);
    onRestoreRef.current(0, { ...WIZARD_DEFAULTS });
  }, []);

  const clearDraft = useCallback(() => {
    clearWizardDraft();
    setRestoredDraft(null);
  }, []);

  return { isHydrating, restoredDraft, dismissDraft, clearDraft };
}
