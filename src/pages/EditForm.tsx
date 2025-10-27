import { useCallback, useMemo } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import 'survey-core/survey-core.css';
import type { ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { useFormBuilder } from '@/hooks/use-form-builder';
import { useDlForm } from '@/hooks/use-frappe-forms';

import './EditForm.css';

const creatorOptions: ICreatorOptions = {
    autoSaveEnabled: true,
    collapseOnDrag: true,
};
export default function EditForm() {
    // URL is /forms/:frappeName/edit
    const { frappeName } = useParams<{ frappeName: string }>();
    const navigate = useNavigate();
    const confirm = useConfirm();
    // Load the doc directly by its Frappe name
    const { doc, docname, upsert } = useDlForm(frappeName ?? null);
    // JSON text for SurveyJS
    const loadedJsonText = useMemo(() => {
        const raw = doc?.schema_json;
        if (!raw) return JSON.stringify({ pages: [] });
        return typeof raw === 'string' ? raw : JSON.stringify(raw);
    }, [doc]);
    // Enable builder when we have a valid doc
    const enabled = Boolean(frappeName && doc);
    const storageKey = useMemo(
        () => (frappeName ? `dl-form-${frappeName}` : 'dl-form-invalid'),
        [frappeName],
    );
    // Persist to Frappe on each debounced autosave
    const persistToFrappe = useCallback(
        async ({ jsonText, title, slug }: { jsonText: string; title: string; slug: string }) => {
            await upsert({
                name: docname ?? frappeName ?? null, // should be present for edits
                title,
                slug,
                schemaJSON: jsonText,
                changelog: 'Autosave',
            });
        },
        [upsert, docname, frappeName],
    );
    const { creator, hasChanges, saveStatus, reset, blockNavigation } = useFormBuilder({
        mode: 'edit',
        initialJson: loadedJsonText,
        storageKey,
        options: creatorOptions,
        enabled, // initialize only when doc is available
        onAutoSave: persistToFrappe,
    });
    if (!frappeName) return null;
    if (!enabled) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-500">Loading form…</p>
            </div>
        );
    }
    const handleFinish = async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Finish and go back?',
            description: 'Your saved changes are already stored. Return to the forms list?',
            confirmText: 'Go to list',
            cancelText: 'Stay',
        });
        if (ok) navigate('/forms');
    };
    const handleReset = async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Reset your changes?',
            description: 'Revert this form back to its original created state.',
            confirmText: 'Reset',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (ok) reset();
    };
    return (
        <div
            className="relative flex flex-col"
            style={{ height: 'calc(100vh - 64px)', width: '100%' }}
        >
            <NavigationGuard
                when={blockNavigation}
                message={
                    saveStatus === 'saving'
                        ? 'A save is still in progress. If you leave now, your latest changes may be lost.'
                        : 'You have unsaved changes. If you leave now, your latest edits will be lost.'
                }
            />
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Edit Form</h2>
                    {saveStatus === 'saving' && (
                        <span className="text-sm text-gray-500 animate-fadeIn">
                            Changes are being saved...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-sm text-gray-500 animate-fadeIn">
                            Latest changes have been saved
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleFinish}
                        disabled={!hasChanges}
                        className="gap-2 disabled:opacity-50 hover:cursor-pointer"
                    >
                        <Save className="h-4 w-4" />
                        Finish Form
                    </Button>
                    <Button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        variant="destructive"
                        className="gap-2 disabled:opacity-50 hover:cursor-pointer"
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
