import { useEffect, useMemo, useRef, useState } from 'react';

import { type ICreatorOptions } from 'survey-creator-core';
import { SurveyCreator } from 'survey-creator-react';

type SaveStatus = 'saving' | 'saved' | null;
type Mode = 'create' | 'edit';

export type UseFormBuilderArgs = {
    mode: Mode;
    /** Initial JSON string to load into the creator at mount */
    initialJson: string;
    /** LocalStorage key to persist to. For create, pass the key you want (e.g., `dl-form-<timestamp>`). */
    storageKey: string;
    /** Survey Creator options */
    options?: ICreatorOptions;
    /** Debounce ms for autosave (default 500ms) */
    debounceMs?: number;
    /** How long to keep the 'saved' badge visible (default 3000ms) */
    savedBadgeMs?: number;
    /** Whether the hook is enabled (default true). When false, no side-effects occur. */
    enabled?: boolean;
    /**
     * Called inside the debounced autosave. Use this to persist to your backend (Frappe).
     * If it returns a Promise, we await it before showing the “saved” badge.
     */
    onAutoSave?: (args: { jsonText: string; title: string; slug: string }) => Promise<void> | void;
};

export function useFormBuilder({
    initialJson,
    storageKey,
    options,
    debounceMs = 500,
    savedBadgeMs = 3000,
    enabled = true,
    onAutoSave,
}: UseFormBuilderArgs) {
    // 1) Creator instance (stable)
    const creator = useMemo(() => new SurveyCreator(options), [options]);

    // 2) UI state
    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

    // 3) Baselines
    const initialJsonRef = useRef<string>(''); // original snapshot (Reset compares to this)
    const lastSavedJsonRef = useRef<string>(''); // last successfully saved value (for guard)

    // 4) Timers
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // util
    const slugify = (s: string) =>
        (s || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 64);

    // 5) Load initial JSON on mount
    useEffect(() => {
        if (!enabled) return; // 🔐 guard
        creator.text = initialJson;
        initialJsonRef.current = initialJson;
        lastSavedJsonRef.current = initialJson;
        setHasChanges(false);
        setSaveStatus(null);
    }, [creator, storageKey, initialJson, enabled]); // storageKey in deps ensures if key changes (different form) we init fresh

    // 6) Register SurveyJS change listeners (debounced autosave)
    useEffect(() => {
        if (!enabled) return; // 🔐 guard

        const handleChange = () => {
            const currentJson = creator.text;
            setHasChanges(currentJson !== initialJsonRef.current);

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);

            // Only do work if changed since last successful save
            if (currentJson !== lastSavedJsonRef.current) {
                setSaveStatus('saving');

                autoSaveTimerRef.current = setTimeout(async () => {
                    try {
                        // Validate JSON
                        JSON.parse(currentJson);

                        // 1) Local draft persistence (optional but handy)
                        localStorage.setItem(storageKey, currentJson);

                        // 2) Server persistence via callback (FRAPPE)
                        if (onAutoSave) {
                            const title = creator.survey?.title || 'Untitled Form';
                            const slug = slugify(title);
                            // Await so the “saved” badge reflects the REAL persisted state
                            await onAutoSave({ jsonText: currentJson, title, slug });
                        }

                        // Mark saved
                        lastSavedJsonRef.current = currentJson;
                        setHasChanges(false);
                        setSaveStatus('saved');

                        // Keep the badge visible for a bit
                        clearStatusTimerRef.current = setTimeout(
                            () => setSaveStatus(null),
                            savedBadgeMs,
                        );
                    } catch (e) {
                        console.error('Auto-save failed:', e);
                        setSaveStatus(null);
                    }
                }, debounceMs);
            }
        };

        creator.onModified.add(handleChange);
        creator.onPropertyChanged.add(handleChange);

        return () => {
            creator.onModified.remove(handleChange);
            creator.onPropertyChanged.remove(handleChange);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
        };
    }, [creator, storageKey, debounceMs, savedBadgeMs, enabled, onAutoSave]);

    // 7) Reset back to the original snapshot
    const reset = () => {
        if (!enabled) return; // 🔐 guard
        const original = initialJsonRef.current;
        creator.text = original;
        localStorage.setItem(storageKey, original);
        lastSavedJsonRef.current = original;
        setHasChanges(false);
        setSaveStatus('saved');
        if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
        clearStatusTimerRef.current = setTimeout(() => setSaveStatus(null), 1500);
    };

    // 8) Block navigation if there are unsaved edits vs last save, or saving in progress
    const unsavedVsLastSaved = enabled && creator.text !== lastSavedJsonRef.current;
    const blockNavigation = Boolean(unsavedVsLastSaved || saveStatus === 'saving');

    // 9) Wire SurveyJS internal save (no-op so Creator doesn't hijack navigation)
    creator.saveSurveyFunc = (saveNo: number, callback: (n: number, ok: boolean) => void) => {
        callback(saveNo, true);
    };

    return {
        creator,
        hasChanges,
        saveStatus,
        reset,
        blockNavigation,
        getInitialJson: () => initialJsonRef.current,
        setInitialJson: (json: string) => {
            initialJsonRef.current = json;
            setHasChanges(creator.text !== initialJsonRef.current);
        },
    };
}
