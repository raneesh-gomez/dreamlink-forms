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

    const { data: detail } = repo.useGet(frappeName ?? '');
    const [completed, setCompleted] = useState(false);
    const [model, setModel] = useState<Model | null>(null);

    const formJson = useMemo(() => {
        if (!detail?.schemaJSON) return null;
        try {
            return JSON.parse(detail.schemaJSON);
        } catch {
            return null;
        }
    }, [detail]);

    const responseIdRef = useRef<string>('');
    if (!responseIdRef.current) {
        try {
            responseIdRef.current =
                typeof window !== 'undefined' && window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : `resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        } catch {
            responseIdRef.current = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
    }

    useEffect(() => {
        if (!frappeName || !formJson) return;
        const survey = new Model(formJson);
        survey.showCompletedPage = false;

        survey.onComplete.add((sender) => {
            const record: LocalResponseRecord = {
                id: responseIdRef.current,
                submittedAt: Date.now(),
                data: sender.data,
            };
            addResponse(frappeName, record);
            setCompleted(true);
        });

        setModel(survey);
    }, [frappeName, formJson]);

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
