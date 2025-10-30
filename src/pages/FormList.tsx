import { useCallback } from 'react';

import { ClipboardCheck, Copy, PenSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import env from '@/config/env';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { useConfirm } from '@/hooks/use-confirm';
import { formatCreatedTime } from '@/lib/date-time-utils';
import type { DLForm } from '@/types/frappe.types';
import type { FormSummary } from '@/types/persistence.types';

const PARENT_DOCTYPE = 'DL Form' as const;

/* ---------- helpers ---------- */

function slugify(s: string): string {
    return (s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 64);
}

function normalizeSchemaText(schemaJSON: string): string {
    try {
        return JSON.stringify(JSON.parse(schemaJSON));
    } catch {
        return schemaJSON;
    }
}

function escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Given the clicked title and all existing titles, compute the next clone title.
 * It ONLY considers exact one-level clones of the clicked title:
 *   clicked="Map test"           => counts /^Map test clone (\d+)$/
 *   clicked="Map test clone 1"   => counts /^Map test clone 1 clone (\d+)$/
 */
function nextCloneTitle(
    clickedTitle: string,
    allTitles: readonly (string | undefined | null)[],
): string {
    const base = clickedTitle.trim().length > 0 ? clickedTitle.trim() : 'Untitled Form';
    const re = new RegExp(`^${escapeRegExp(base)}\\s+clone\\s+(\\d+)$`, 'i');

    const indices: number[] = [];
    for (const t of allTitles) {
        const title = (t ?? '').trim();
        const m = re.exec(title);
        if (m) {
            const n = parseInt(m[1], 10);
            if (Number.isFinite(n)) indices.push(n);
        }
    }

    const next = (indices.length ? Math.max(...indices) : 0) + 1;
    return `${base} clone ${next}`;
}

/** Strict fetcher (same shape as in your repo) */
async function fetchFormStrict(name: string): Promise<DLForm> {
    const url = `${env.frappeUrl}/api/resource/${encodeURIComponent(PARENT_DOCTYPE)}/${encodeURIComponent(name)}`;

    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            Authorization: `token ${env.frappeToken}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch ${PARENT_DOCTYPE} ${name}: ${text}`);
    }

    const raw = await res.text();
    try {
        const json = JSON.parse(raw) as { data: DLForm };
        return json.data;
    } catch {
        const snippet = raw.slice(0, 200).replace(/\s+/g, ' ');
        throw new Error(
            `Expected JSON from ${url} but received non-JSON content (first 200 chars): ${snippet}`,
        );
    }
}

/* ---------- component ---------- */

export default function FormList() {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { mode, repo } = useFormRepositoryContext();

    const { data: forms, isLoading, mutate } = repo.useList();
    const { remove } = repo.useRemove();
    const { upsert } = repo.useUpsert();

    const handleDelete = useCallback(
        async (name: string) => {
            const ok = await confirm({
                title: 'Delete this form?',
                description: 'This action cannot be undone.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'destructive',
            });
            if (!ok) return;
            await remove(name);
            await mutate();
        },
        [confirm, remove, mutate],
    );

    const handleDuplicate = useCallback(
        async (form: FormSummary) => {
            // 1) Fetch full form (to copy schema_json)
            const original = await fetchFormStrict(form.name);

            // 2) Compute cloned title using ONLY exact one-level matches for the clicked card's title
            const allTitles = (forms ?? []).map((f) => f.title ?? '');
            const clonedTitle = nextCloneTitle(form.title ?? 'Untitled Form', allTitles);
            const clonedSlug = slugify(clonedTitle);

            // 3) Parse and update internal SurveyJS schema title
            let schemaObj: Record<string, unknown> = {};
            try {
                schemaObj =
                    typeof original.schema_json === 'string'
                        ? JSON.parse(original.schema_json)
                        : (original.schema_json as Record<string, unknown>);
            } catch {
                schemaObj = {};
            }
            schemaObj.title = clonedTitle;

            // 4) Normalize schema JSON
            const schemaJSON = normalizeSchemaText(JSON.stringify(schemaObj));

            // 5) Create clone via upsert
            await upsert({
                name: null,
                title: clonedTitle,
                slug: clonedSlug,
                schemaJSON,
                changelog: `Cloned from ${(form.title ?? 'Untitled Form').trim() || 'Untitled Form'}`,
            });

            // 6) Refresh and navigate to edit
            await mutate();
        },
        [forms, mutate, navigate, upsert],
    );

    if (isLoading) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-500">Loading forms…</p>
            </div>
        );
    }

    if (!forms?.length) {
        return (
            <div key={mode} className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">My Forms</h1>
                <p className="text-center text-gray-500">
                    No forms created yet. Start by creating a new form!
                </p>
            </div>
        );
    }

    return (
        <div key={mode} className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Forms</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                    <div
                        key={form.name}
                        onClick={() => navigate(`/forms/${form.name}`)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                        <h2 className="text-lg font-semibold mb-2">
                            {form.title || 'Untitled Form'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Created: {formatCreatedTime(form.creation)}
                        </p>
                        {form.status && (
                            <p className="text-sm text-gray-400">Status: {form.status}</p>
                        )}

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/forms/${form.name}/responses`);
                                }}
                                variant="ghost"
                                size="icon"
                                title="View Responses"
                                aria-label="View Responses"
                                className="text-gray-600 hover:text-green-600 hover:bg-green-50 hover:cursor-pointer"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/forms/${form.name}/edit`);
                                }}
                                variant="ghost"
                                size="icon"
                                title="Edit Form"
                                aria-label="Edit Form"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:cursor-pointer"
                            >
                                <PenSquare className="h-4 w-4" />
                            </Button>

                            {/* Duplicate */}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDuplicate(form);
                                }}
                                variant="ghost"
                                size="icon"
                                title="Duplicate Form"
                                aria-label="Duplicate Form"
                                className="text-gray-600 hover:text-amber-600 hover:bg-amber-50 hover:cursor-pointer"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await handleDelete(form.name);
                                }}
                                variant="ghost"
                                size="icon"
                                title="Delete Form"
                                aria-label="Delete Form"
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50 hover:cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
