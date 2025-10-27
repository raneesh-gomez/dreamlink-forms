import { useCallback, useMemo } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ICreatorOptions } from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { useFormBuilder } from '@/hooks/use-form-builder';
import { useDlForm } from '@/hooks/use-frappe-forms';

const defaultCreatorOptions: ICreatorOptions = { autoSaveEnabled: true, collapseOnDrag: true };
const defaultJson = { pages: [] };

export default function CreateForm(props: { json?: object; options?: ICreatorOptions }) {
    const navigate = useNavigate();
    const confirm = useConfirm();

    // give every new form a stable draft key for this session
    const storageKey = useMemo(() => `dl-form-${Date.now()}`, []);
    const initialJson = JSON.stringify(props.json ?? defaultJson);

    // frappe upsert hook (docname is null until first create)
    const { upsert, docname } = useDlForm(null);

    // callback the builder will call on each debounced autosave
    const persistToFrappe = useCallback(
        async ({ jsonText, title, slug }: { jsonText: string; title: string; slug: string }) => {
            const res = await upsert({
                name: docname ?? null, // null = create
                title,
                slug,
                schemaJSON: jsonText,
                changelog: 'Autosave',
            });

            // ⚠️ Save the frappe docname for future edits
            if (!docname && res?.name) {
                localStorage.setItem(`dl-form-${storageKey}-frappe-name`, res.name);
            }
        },
        [upsert, docname, storageKey],
    );

    const { creator, hasChanges, saveStatus, reset, blockNavigation } = useFormBuilder({
        mode: 'create',
        initialJson,
        storageKey,
        options: props.options || defaultCreatorOptions,
        onAutoSave: persistToFrappe, // <-- this is the line that persists to Frappe
    });

    const handleFinish = async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Finish and go back?',
            description: "You'll return to the forms list.",
            confirmText: 'Go to list',
            cancelText: 'Stay',
        });
        if (ok) navigate('/forms');
    };

    const handleReset = async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Reset this form?',
            description: 'All progress will be lost.',
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
                    <h2 className="text-lg font-semibold">Create Form</h2>
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
                        className="gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Finish Form
                    </Button>
                    <Button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        variant="destructive"
                        className="gap-2 disabled:opacity-50"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset Form
                    </Button>
                </div>
            </div>

            <div className="flex-1">
                <SurveyCreatorComponent creator={creator} />
            </div>
        </div>
    );
}
