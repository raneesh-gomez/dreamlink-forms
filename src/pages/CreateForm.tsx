import { useCallback, useEffect, useMemo, useRef } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'survey-core/survey-core.css';
import type { ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreatorComponent } from 'survey-creator-react';

import NavigationGuard from '@/components/common/NavigationGuard';
import '@/components/surveyjs/location-picker/LocationPickerImpl';
import '@/components/surveyjs/location-picker/LocationPickerQuestion';
import '@/components/surveyjs/location-picker/location-picker.icon';
import { Button } from '@/components/ui/button';
import { SurveyJS } from '@/constants';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { useConfirm } from '@/hooks/use-confirm';
import { useFormBuilder } from '@/hooks/use-form-builder';

import './CreateForm.css';

const defaultCreatorOptions: ICreatorOptions = {
    autoSaveEnabled: false,
    collapseOnDrag: true,
    showTranslationTab: true,
};
const defaultJson = { pages: [] };

function slugify(s: string): string {
    return (s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 64);
}

export default function CreateForm(props: { json?: object; options?: ICreatorOptions }) {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { mode, repo } = useFormRepositoryContext();
    const { upsert } = repo.useUpsert();

    const storageKey = useMemo(() => `dl-form-${Date.now()}`, []);
    const initialJson = useMemo(() => JSON.stringify(props.json ?? defaultJson), [props.json]);

    // After first successful save, store the server-assigned name so subsequent saves UPDATE
    const createdNameRef = useRef<string | null>(null);

    const { creator, hasChanges, /* saveStatus removed */ reset, blockNavigation, markSaved } =
        useFormBuilder({
            mode: 'create',
            initialJson,
            storageKey,
            options: props.options || defaultCreatorOptions,
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

    // Define callbacks before rendering (Rules of Hooks)
    const handleCreate = useCallback(async () => {
        if (!creator) return;

        const jsonText: string = (creator as unknown as { text: string }).text;

        // Extract title from JSON (fallback to Untitled)
        let titleFromJson: string | undefined;
        try {
            const parsed = JSON.parse(jsonText) as { title?: string } | null;
            titleFromJson = parsed?.title;
        } catch {
            // ignore
        }
        const title = titleFromJson || 'Untitled';
        const slug = slugify(title);

        const res = await upsert({
            name: createdNameRef.current, // null on first save → create; thereafter → update
            title,
            slug,
            schemaJSON: jsonText,
            changelog: createdNameRef.current ? 'Manual update' : 'Manual create',
        });

        if (!createdNameRef.current) {
            createdNameRef.current = res.name;
        }

        // Mark current JSON as saved so hasChanges flips to false
        markSaved();

        const ok = await confirm({
            title: 'Created',
            description: 'Your form has been saved. Go to the forms list?',
            confirmText: 'Go to list',
            cancelText: 'Stay',
        });
        if (ok) navigate('/forms');
    }, [creator, upsert, confirm, navigate, markSaved]);

    const handleReset = useCallback(async () => {
        if (!hasChanges) return;
        const ok = await confirm({
            title: 'Reset this form?',
            description: 'All progress will be lost.',
            confirmText: 'Reset',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (ok) reset();
    }, [hasChanges, confirm, reset]);

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
                <h2 className="text-lg font-semibold">Create Form</h2>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleCreate}
                        disabled={!hasChanges}
                        className="gap-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Create Form
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
