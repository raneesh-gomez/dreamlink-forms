import { useCallback, useEffect, useMemo, useRef } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import 'survey-core/survey-core.css';
import type { ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import { Button } from '@/components/ui/button';
import { SurveyJS } from '@/constants';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { useConfirm } from '@/hooks/use-confirm';
import { useFormBuilder } from '@/hooks/use-form-builder';
import { diffEntries, extractTranslatables, toEnJson } from '@/i18n/extractor';

import './EditForm.css';

// Manual-save flow: disable internal autosave
const creatorOptions: ICreatorOptions = {
    autoSaveEnabled: false,
    collapseOnDrag: true,
    showTranslationTab: true,
};

function downloadJson(filename: string, data: object) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

export default function EditForm() {
    const { frappeName } = useParams<{ frappeName: string }>();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { mode, repo } = useFormRepositoryContext();

    // Repo
    const { data: detail } = repo.useGet(frappeName ?? null);
    const { upsert } = repo.useUpsert();

    // JSON boot
    const loadedJsonText = useMemo(
        () => detail?.schemaJSON ?? JSON.stringify({ pages: [] }),
        [detail],
    );

    const enabled = Boolean(frappeName && detail);

    const storageKey = useMemo(
        () => (frappeName ? `dl-form-${frappeName}` : 'dl-form-invalid'),
        [frappeName],
    );

    const { creator, hasChanges, reset, blockNavigation, markSaved } = useFormBuilder({
        mode: 'edit',
        initialJson: loadedJsonText,
        storageKey,
        options: creatorOptions,
        enabled,
    });

    const addedToToolboxRef = useRef(false);
    useEffect(() => {
        if (!creator || addedToToolboxRef.current) return;

        const exists = creator.toolbox.getItemByName?.(SurveyJS.LOCATION_PICKER_TYPE);
        if (!exists) {
            creator.toolbox.addItem({
                name: SurveyJS.LOCATION_PICKER_TYPE,
                title: 'Location Picker',
                category: 'general',
                iconName: 'icon-location-picker',
                json: {
                    type: SurveyJS.LOCATION_PICKER_TYPE,
                    title: 'Select a location',
                    defaultLat: 6.9271,
                    defaultLng: 79.8612,
                    defaultZoom: 7,
                },
            });
        }

        addedToToolboxRef.current = true;
    }, [creator]);

    // Define callbacks before early returns (Rules of Hooks)

    const handleSave = useCallback(async () => {
        if (!creator || !frappeName) return;

        const jsonText: string = (creator as unknown as { text: string }).text;

        let titleFromJson: string | undefined;
        try {
            const parsed = JSON.parse(jsonText) as { title?: string } | null;
            titleFromJson = parsed?.title;
        } catch {
            /* ignore */
        }

        const safeTitle = titleFromJson || detail?.title || 'Untitled';

        try {
            await upsert({
                name: frappeName,
                title: safeTitle,
                slug: undefined, // keep slug unchanged during edit
                schemaJSON: jsonText,
                changelog: 'Manual save',
            });

            // 🔑 mark current content as saved so hasChanges flips to false
            markSaved();

            const ok = await confirm({
                title: 'Saved',
                description: 'Your changes have been saved. Go back to the forms list?',
                confirmText: 'Go to list',
                cancelText: 'Stay',
            });
            if (ok) navigate('/forms');
        } catch {
            toast.error('Failed to save form. Please try again.');
        }
    }, [creator, frappeName, detail?.title, upsert, confirm, navigate, markSaved]);

    const handleReset = useCallback(async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Reset your changes?',
            description: 'Revert this form back to its original created state.',
            confirmText: 'Reset',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (ok) reset();
    }, [hasChanges, confirm, reset]);

    if (!frappeName) return null;

    if (!enabled) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-500">Loading form…</p>
            </div>
        );
    }

    return (
        <div
            key={mode}
            className="relative flex flex-col"
            style={{ height: 'calc(100vh - 64px)', width: '100%' }}
        >
            <NavigationGuard
                when={blockNavigation}
                message="You have unsaved changes. If you leave now, your latest edits will be lost."
            />

            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                <h2 className="text-lg font-semibold">Edit Form</h2>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        id="prev-en-json"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                                try {
                                    const prev = JSON.parse(String(reader.result) || '{}');
                                    (window as any).__prevEnJson = prev; // stash for diff
                                    toast.success('Loaded previous en.json for diff');
                                } catch {
                                    toast.error('Invalid en.json file');
                                }
                            };
                            reader.readAsText(file);
                        }}
                    />

                    <Button
                        variant="secondary"
                        onClick={() => {
                            const surveyJson = creator.JSON || { pages: [] };
                            const slug = (surveyJson?.slug as string) || 'unnamed'; // or get from your Frappe record
                            const entries = extractTranslatables(surveyJson, slug);
                            const full = toEnJson(entries);
                            const prev = (window as any).__prevEnJson as
                                | Record<string, { source: string; checksum: string }>
                                | undefined;
                            if (prev) {
                                const diff = diffEntries(entries, prev);
                                const filename = `${slug}-en-diff.json`;
                                downloadJson(filename, diff);
                            } else {
                                const filename = `${slug}-en.json`;
                                downloadJson(filename, full);
                            }
                        }}
                        className="gap-2"
                        title="Export source strings for translators (diff if a previous en.json was loaded)"
                    >
                        Export i18n (diff)
                    </Button>

                    <label htmlFor="prev-en-json" className="ml-2">
                        <Button variant="outline" title="Load previous en.json to compute a diff">
                            Load prev en.json
                        </Button>
                    </label>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                    <Button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        variant="destructive"
                        className="gap-2 disabled:opacity-50"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset Changes
                    </Button>
                </div>
            </div>

            <div className="flex-1">
                <SurveyCreatorComponent creator={creator} />
            </div>
        </div>
    );
}
