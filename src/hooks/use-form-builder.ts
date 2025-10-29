import { useEffect, useMemo, useRef, useState } from 'react';

import type { ICreatorOptions } from 'survey-creator-core';
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
    const initialJsonRef = useRef<string>(''); // snapshot of JSON at mount (or load)
    const lastSavedJsonRef = useRef<string>(''); // snapshot of last successful save

    // 4) Timers
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const slugify = (s: string) =>
        (s || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 64);

    // 5) Load initial JSON on mount / when enabled toggles true
    useEffect(() => {
        if (!enabled) return;
        creator.text = initialJson;
        initialJsonRef.current = initialJson;
        lastSavedJsonRef.current = initialJson; // 🔑 baseline = last saved
        setHasChanges(false);
        setSaveStatus(null);
    }, [creator, storageKey, initialJson, enabled]);

    // 6) Register SurveyJS change listeners (debounced autosave)
    useEffect(() => {
        if (!enabled) return;

        const handleChange = () => {
            const currentJson = creator.text;

            // 🔑 Compare against last saved (not original) so this works with manual-save flows
            setHasChanges(currentJson !== lastSavedJsonRef.current);

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);

            // Auto-save path (optional). Only run if the content differs from the last saved snapshot.
            if (onAutoSave && currentJson !== lastSavedJsonRef.current) {
                setSaveStatus('saving');

                autoSaveTimerRef.current = setTimeout(async () => {
                    try {
                        JSON.parse(currentJson); // validate

                        // 1) Local draft
                        localStorage.setItem(storageKey, currentJson);

                        // 2) Server persistence via callback (await so status reflects true persistence)
                        const title =
                            (creator.JSON as { title?: string } | undefined)?.title ??
                            'Untitled Form';
                        const slug = slugify(title);
                        await onAutoSave({ jsonText: currentJson, title, slug });

                        // Mark saved (update baseline to the just-saved JSON)
                        lastSavedJsonRef.current = currentJson;
                        setHasChanges(false);
                        setSaveStatus('saved');

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

        // Creator-level signal when survey content changes in the designer
        creator.onModified.add(handleChange);
        // Extra signal: property changes
        creator.onPropertyChanged.add(handleChange);
        // Survey-level signal (belt & suspenders)
        creator.survey.onPropertyChanged.add(handleChange);

        return () => {
            creator.onModified.remove(handleChange);
            creator.onPropertyChanged.remove(handleChange);
            creator.survey.onPropertyChanged.remove(handleChange);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
        };
    }, [creator, storageKey, debounceMs, savedBadgeMs, enabled, onAutoSave]);

    // 7) Reset back to the original snapshot
    const reset = () => {
        if (!enabled) return;
        const original = initialJsonRef.current;
        creator.text = original;
        localStorage.setItem(storageKey, original);
        lastSavedJsonRef.current = original;
        setHasChanges(false);
        setSaveStatus('saved');
        if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
        clearStatusTimerRef.current = setTimeout(() => setSaveStatus(null), 1500);
    };

    // 🔑 8) Public API for manual-save flows: mark current content as saved
    const markSaved = () => {
        if (!enabled) return;
        const current = creator.text;
        lastSavedJsonRef.current = current;
        setHasChanges(false);
    };

    // 9) Block navigation if there are unsaved edits vs last saved, or saving in progress
    const unsavedVsLastSaved = enabled && creator.text !== lastSavedJsonRef.current;
    const blockNavigation = Boolean(unsavedVsLastSaved || saveStatus === 'saving');

    // 10) Keep Creator from hijacking navigation (we manage saving ourselves)
    creator.saveSurveyFunc = (saveNo: number, callback: (n: number, ok: boolean) => void) => {
        callback(saveNo, true);
    };

    return {
        creator,
        hasChanges, // 🔄 based on lastSaved baseline
        saveStatus,
        reset,
        blockNavigation,
        // expose helpers for manual-save flows
        getInitialJson: () => initialJsonRef.current,
        setInitialJson: (json: string) => {
            initialJsonRef.current = json;
            // keep hasChanges consistent with baseline of lastSaved
            setHasChanges(creator.text !== lastSavedJsonRef.current);
        },
        markSaved, // 🔑 call this after a successful manual save
    };
}
