import { useEffect, useMemo } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import 'survey-core/survey-core.css';
import { type ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { useSurveyBuilder } from '@/hooks/use-survey-builder';

// ⬅️ shadcn

import './EditSurvey.css';

const creatorOptions: ICreatorOptions = {
    autoSaveEnabled: true,
    collapseOnDrag: true,
};

export default function EditSurvey() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const loadedJson = useMemo(() => {
        if (!id) return null;
        return localStorage.getItem(`survey-${id}`);
    }, [id]);

    const enabled = Boolean(id && loadedJson);
    const storageKey = useMemo(() => (id ? `survey-${id}` : 'survey-invalid'), [id]);
    const initialJson = loadedJson ?? JSON.stringify({ pages: [] });

    const { creator, hasChanges, saveStatus, reset, blockNavigation } = useSurveyBuilder({
        mode: 'edit',
        initialJson,
        storageKey,
        options: creatorOptions,
        enabled,
    });

    useEffect(() => {
        if (!enabled) navigate('/forms', { replace: true });
    }, [enabled, navigate]);

    if (!enabled) return null;

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
