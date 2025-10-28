import { useCallback, useMemo } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import 'survey-core/survey-core.css';
import type { ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import { Button } from '@/components/ui/button';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { useConfirm } from '@/hooks/use-confirm';
import { useFormBuilder } from '@/hooks/use-form-builder';

import './EditForm.css';

const creatorOptions: ICreatorOptions = { autoSaveEnabled: true, collapseOnDrag: true };

export default function EditForm() {
    const { frappeName } = useParams<{ frappeName: string }>();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { mode, repo } = useFormRepositoryContext();

    const { data: detail } = repo.useGet(frappeName ?? '');
    const { upsert } = repo.useUpsert();

    const loadedJsonText = useMemo(
        () => detail?.schemaJSON ?? JSON.stringify({ pages: [] }),
        [detail],
    );

    const enabled = Boolean(frappeName && detail);
    const storageKey = useMemo(
        () => (frappeName ? `dl-form-${frappeName}` : 'dl-form-invalid'),
        [frappeName],
    );

    const persistOnAutoSave = useCallback(
        async ({ jsonText, title, slug }: { jsonText: string; title: string; slug: string }) => {
            await upsert({
                name: frappeName ?? null,
                title,
                slug,
                schemaJSON: jsonText,
                changelog: 'Autosave',
            });
        },
        [upsert, frappeName],
    );

    const { creator, hasChanges, saveStatus, reset, blockNavigation } = useFormBuilder({
        mode: 'edit',
        initialJson: loadedJsonText,
        storageKey,
        options: creatorOptions,
        enabled,
        onAutoSave: persistOnAutoSave,
    });

    if (!frappeName) return null;
    if (!enabled) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
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
            key={mode}
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
