// src/pages/forms/FormPreview.tsx
import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Model } from 'survey-core';
import 'survey-core/survey-core.min.css';
import { Survey } from 'survey-react-ui';

import { Button } from '@/components/ui/button';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { applyTranslations } from '@/i18n/apply';
import { ensureSurveyLocale } from '@/i18n/surveyjs-locales';
import { type LocalResponseRecord, addResponse } from '@/lib/responses-local';
import type { DLForm, DLFormStatus, DLFormVersion } from '@/types/frappe.types';

const DOCTYPE = 'DL Form' as const;
const STATUS_OPTIONS: DLFormStatus[] = ['Draft', 'Published', 'Archived'];

/** Create a client-side download of text content as a file. */
function downloadText(filename: string, content: string, mime: string = 'application/json'): void {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Safari requires the element to be in the DOM
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export default function FormPreview() {
    const { frappeName } = useParams<{ frappeName: string }>();
    const navigate = useNavigate();
    const { mode, repo } = useFormRepositoryContext();

    const [locale, setLocale] = useState<string>('en');
    const [tDict, setTDict] = useState<Record<string, string>>({});

    // Baseline (summary) from repo to keep parity with rest of app
    const { data: detail } = repo.useGet(frappeName ?? null);

    // Full doc for versions & status
    const safeName = frappeName ?? '__noop__';
    const { data: fullDoc } = useFrappeGetDoc<DLForm>(DOCTYPE, safeName);
    const { updateDoc } = useFrappeUpdateDoc<DLForm>();

    // UI state
    // selectedVersion: 0 => Latest (parent.schema_json). Otherwise, one of the child version numbers.
    const [selectedVersion, setSelectedVersion] = useState<number>(0);
    const [selectedStatus, setSelectedStatus] = useState<DLFormStatus>('Draft');

    // Sync selectedStatus when doc loads/changes
    useEffect(() => {
        if (fullDoc?.status) {
            setSelectedStatus(fullDoc.status);
        }
    }, [fullDoc?.status]);

    // Version options
    const versionOptions = useMemo(() => {
        const versions = (fullDoc?.versions ?? []).slice().sort((a, b) => a.version - b.version);
        const latest =
            fullDoc?.current_version ??
            (versions.length ? versions[versions.length - 1].version : 0);
        return { list: versions, latest };
    }, [fullDoc?.versions, fullDoc?.current_version]);

    // Effective schema text for preview based on selection
    const schemaJsonText: string = useMemo(() => {
        if (!fullDoc) return '';
        if (selectedVersion === 0) {
            return typeof fullDoc.schema_json === 'string'
                ? fullDoc.schema_json
                : JSON.stringify(fullDoc.schema_json ?? {});
        }
        const match: DLFormVersion | undefined = (fullDoc.versions ?? []).find(
            (v) => v.version === selectedVersion,
        );
        return match
            ? typeof match.schema_json === 'string'
                ? match.schema_json
                : JSON.stringify(match.schema_json ?? {})
            : typeof fullDoc.schema_json === 'string'
              ? fullDoc.schema_json
              : JSON.stringify(fullDoc.schema_json ?? {});
    }, [fullDoc, selectedVersion]);

    // Parse schema when the text changes
    const formJson = useMemo(() => {
        if (!schemaJsonText) return null;
        try {
            return JSON.parse(schemaJsonText) as Record<string, unknown>;
        } catch {
            return null;
        }
    }, [schemaJsonText]);

    // Pick a stable slug for keying translations (prefer the form's slug, fall back to frappeName)
    const surveySlug = useMemo(() => {
        const fromDoc = (fullDoc as DLForm | undefined)?.slug?.trim();
        return fromDoc || frappeName || 'unnamed';
    }, [fullDoc?.slug, frappeName]);

    // Apply translations (if any) to the parsed schema
    const jsonForRender = useMemo(() => {
        if (!formJson) return null;
        if (tDict && Object.keys(tDict).length > 0) {
            return applyTranslations(formJson, surveySlug, tDict);
        }
        return formJson;
    }, [formJson, tDict, surveySlug]);

    // Response id stable
    const responseIdRef = useRef<string>('');
    if (!responseIdRef.current) {
        responseIdRef.current =
            crypto?.randomUUID?.() ??
            `resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    // Build Survey model when schema text changes
    const [model, setModel] = useState<Model | null>(null);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!frappeName || !jsonForRender) return;

        // (Optional) ensure SurveyJS has UI chrome for this locale (if you use custom locales)
        ensureSurveyLocale(locale);

        const survey = new Model(jsonForRender);
        survey.showCompletedPage = false;
        survey.locale = locale; // <-- set runtime UI language

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
            if (typeof (survey as unknown as { dispose?: () => void }).dispose === 'function') {
                (survey as unknown as { dispose: () => void }).dispose();
            }
        };
        // IMPORTANT: depend on translated JSON and locale now
    }, [frappeName, jsonForRender, locale]);

    // Handlers
    const handleVersionChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
        const v = Number(e.target.value);
        setCompleted(false);
        setSelectedVersion(Number.isFinite(v) ? v : 0);
    };

    const handleStatusChange: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
        const next = e.target.value as DLFormStatus;
        setSelectedStatus(next); // optimistic
        if (frappeName) {
            try {
                await updateDoc(DOCTYPE, frappeName, { status: next });
                toast.success(`Form status updated to ${next}.`);
            } catch {
                toast.error('Failed to update form status.');
            }
        }
    };

    const handleDownload = (): void => {
        if (!fullDoc) return;

        // Decide effective version number for filename
        const effectiveVersion =
            selectedVersion === 0
                ? fullDoc.current_version || versionOptions.latest || 1
                : selectedVersion;

        // Pretty-print the JSON if possible
        let content = schemaJsonText;
        try {
            const parsed = JSON.parse(schemaJsonText) as unknown;
            content = JSON.stringify(parsed, null, 2);
        } catch {
            // keep as-is if it's not valid JSON; still allow download
        }

        const safeName = fullDoc.name.replace(/[^\w.-]+/g, '_');
        const filename = `${safeName}-v${effectiveVersion}.json`;
        downloadText(filename, content, 'application/json');
    };

    if (!frappeName) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <div className="rounded-lg border p-6">Invalid form.</div>
            </div>
        );
    }
    if (!detail || !fullDoc) {
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

    const versions: DLFormVersion[] = versionOptions.list;
    const latestLabel = `Latest (v${versionOptions.latest || fullDoc.current_version || 1})`;

    return (
        <div key={mode} className="container mx-auto px-4 py-8">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="gap-2 hover:cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={locale}
                        onChange={(e) => {
                            setLocale(e.target.value);
                        }}
                        className="border rounded px-2 py-1"
                        aria-label="Locale"
                    >
                        <option value="en">en</option>
                        <option value="si">si</option>
                        <option value="ta">ta</option>
                        {/* add the locales you support */}
                    </select>

                    <input
                        type="file"
                        accept="application/json"
                        id="locale-json"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                                try {
                                    const parsed = JSON.parse(String(reader.result) || '{}');
                                    setTDict(parsed); // expects flat { key: translatedText }
                                    toast.success('Loaded locale dictionary');
                                } catch {
                                    toast.error('Invalid locale JSON');
                                }
                            };
                            reader.readAsText(file);
                        }}
                    />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    {/* Version selector */}
                    <label className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Version</span>
                        <select
                            value={selectedVersion}
                            onChange={handleVersionChange}
                            className="rounded-md border px-2 py-1 text-sm"
                        >
                            <option value={0}>{latestLabel}</option>
                            {versions.map((v) => (
                                <option key={v.version} value={v.version}>
                                    v{v.version}
                                    {v.changelog ? ` – ${v.changelog}` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Status selector */}
                    <label className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            className="rounded-md border px-2 py-1 text-sm"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Export control */}
                    <Button onClick={handleDownload} className="gap-2 hover:cursor-pointer">
                        <Download className="h-4 w-4" />
                        Export JSON
                    </Button>
                </div>
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
