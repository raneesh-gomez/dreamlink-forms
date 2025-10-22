import { useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Model } from 'survey-core';
import 'survey-core/survey-core.min.css';
import { Survey } from 'survey-react-ui';

import { Button } from '@/components/ui/button';
import { type LocalResponseRecord, addResponse } from '@/lib/responses-local';

export default function FormPreview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [completed, setCompleted] = useState<boolean>(false);
    const [model, setModel] = useState<Model | null>(null);

    function generateResponseId(): string {
        try {
            if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
                return window.crypto.randomUUID();
            }
        } catch {
            // ignore and fall back
        }
        const rand = Math.random().toString(36).slice(2, 10);
        return `resp-${Date.now()}-${rand}`;
    }

    const responseIdRef = useRef<string>('');
    if (!responseIdRef.current) {
        responseIdRef.current = generateResponseId();
    }

    // Load form JSON
    const formJson = useMemo(() => {
        if (!id) return null;
        const json = localStorage.getItem(`dl-form-${id}`);
        return json ? JSON.parse(json) : null;
    }, [id]);

    useEffect(() => {
        if (!id || !formJson) return;

        const survey = new Model(formJson);

        survey.showCompletedPage = false;

        survey.onComplete.add((sender) => {
            const record: LocalResponseRecord = {
                id: responseIdRef.current,
                submittedAt: Date.now(),
                data: sender.data,
            };
            addResponse(id, record);
            setCompleted(true);
        });

        setModel(survey);
    }, [id, formJson]);

    if (!id) return <div className="container mx-auto px-4 py-8">Invalid form.</div>;
    if (!formJson) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Form not found.</div>
            </div>
        );
    }
    if (!model) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Loading form…</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
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
                    <Button onClick={() => navigate(`/forms/${id}/responses`)}>
                        View Responses
                    </Button>
                </div>
            )}
        </div>
    );
}
