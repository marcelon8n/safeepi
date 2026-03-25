import { useEffect, useCallback, useRef } from "react";

/**
 * Persists form state to sessionStorage so drafts survive navigation.
 * 
 * @param key - Unique sessionStorage key (e.g. "draft_novo_colaborador")
 * @param form - Current form state object
 * @param setForm - Setter to restore draft values
 * @param enabled - Only persist when true (e.g. modal is open & not editing)
 */
export function useFormDraft<T extends Record<string, any>>(
  key: string,
  form: T,
  setForm: (val: T) => void,
  enabled: boolean,
) {
  const initialized = useRef(false);

  // Restore draft on mount / when enabled becomes true
  useEffect(() => {
    if (!enabled) {
      initialized.current = false;
      return;
    }
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        setForm(parsed);
      }
    } catch {
      // ignore parse errors
    }
    initialized.current = true;
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft on every form change (debounced via effect)
  useEffect(() => {
    if (!enabled || !initialized.current) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(form));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [key, form, enabled]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
