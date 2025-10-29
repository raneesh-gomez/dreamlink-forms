// src/pages/forms/FormPreview.tsx
import { useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Model } from 'survey-core';
import 'survey-core/survey-core.min.css';
import { Survey } from 'survey-react-ui';

import { Button } from '@/components/ui/button';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { type LocalResponseRecord, addResponse } from '@/lib/responses-local';

export default function FormPreview() {
    const { frappeName } = useParams<{ frappeName: string }>();
    const navigate = useNavigate();
    const { mode, repo } = useFormRepositoryContext();

    // Use null when absent so the repo disables fetching cleanly
    const { data: detail } = repo.useGet(frappeName ?? null);

    const [completed, setCompleted] = useState(false);
    const [model, setModel] = useState<Model | null>(null);

    // Keep a stable JSON string; avoid re-parsing unless the string changes
    const schemaJsonText = detail?.schemaJSON ?? '';

    // Parse only when the text changes, return null if invalid
    const formJson = useMemo(() => {
        if (!schemaJsonText) return null;
        try {
            return JSON.parse(schemaJsonText) as Record<string, unknown>;
        } catch {
            return null;
        }
    }, [schemaJsonText]);

    // Generate response id once, not during render loops
    const responseIdRef = useRef<string>('');
    if (!responseIdRef.current) {
        responseIdRef.current =
            crypto?.randomUUID?.() ??
            `resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    // Normalize the initializer trick from above:
    if (typeof responseIdRef.current === 'function') {
        // run the initializer exactly once
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        const init = responseIdRef.current as unknown as Function;
        responseIdRef.current = init() as string;
    }

    // Build/dispose the SurveyJS model when the *string* (or name) changes
    useEffect(() => {
        if (!frappeName || !formJson) return;

        const survey = new Model(formJson);
        survey.showCompletedPage = false;

        const onComplete = (sender: Model) => {
            const record: LocalResponseRecord = {
                id: responseIdRef.current,
                submittedAt: Date.now(),
                data: sender.data as Record<string, unknown>,
            };
            addResponse(frappeName, record);
            setCompleted(true);
        };

        survey.onComplete.add(onComplete);
        setModel(survey);

        return () => {
            survey.onComplete.remove(onComplete);
            // dispose to avoid dangling observers / memory leaks
            if (typeof (survey as unknown as { dispose?: () => void }).dispose === 'function') {
                (survey as unknown as { dispose: () => void }).dispose();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frappeName, schemaJsonText]); // 🔑 depend on the stable string, not the parsed object

    if (!frappeName) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Invalid form.</div>
            </div>
        );
    }
    if (!detail) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Loading form…</div>
            </div>
        );
    }
    if (!formJson) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Form not found or invalid schema.</div>
            </div>
        );
    }
    if (!model) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Preparing form…</div>
            </div>
        );
    }

    return (
        <div key={mode} className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            <Survey model={model} />

            {completed && (
                <div className="mt-6 flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-4">
                    <div className="text-sm text-green-800">
                        Response saved. You can view it in the “Responses” page.
                    </div>
                    <Button onClick={() => navigate(`/forms/${frappeName}/responses`)}>
                        View Responses
                    </Button>
                </div>
            )}
        </div>
    );
}
