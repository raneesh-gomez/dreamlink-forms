import {
    useFrappeCreateDoc,
    useFrappeDeleteDoc,
    useFrappeGetDoc,
    useFrappeGetDocList,
    useFrappeUpdateDoc,
} from 'frappe-react-sdk';

import env from '@/config/env';
import type { DLForm, DLFormStatus, DLFormVersion } from '@/types/frappe.types';
import type {
    FormDetail,
    FormHooksRepository,
    FormSummary,
    RepoError,
    UpsertInput,
} from '@/types/persistence.types';

const PARENT_DOCTYPE = 'DL Form' as const;

/* ---------- helpers ---------- */

function normalizeSchemaText(schemaJSON: string): string {
    try {
        return JSON.stringify(JSON.parse(schemaJSON));
    } catch {
        return schemaJSON;
    }
}

function asSchemaText(v: DLForm['schema_json']): string {
    return typeof v === 'string' ? v : JSON.stringify(v);
}

function isoToEpoch(iso?: string | null): number {
    if (!iso) return Date.now();
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : Date.now();
}

/** IMPORTANT: FormDetail in your codebase does NOT include slug/currentVersion */
function toDetail(doc: DLForm): FormDetail {
    return {
        name: doc.name,
        title: doc.title,
        status: doc.status,
        schemaJSON: asSchemaText(doc.schema_json),
        creation: isoToEpoch(doc.creation ?? null),
        modified: isoToEpoch(doc.modified ?? null),
    };
}

function toSummary(doc: DLForm): FormSummary {
    return {
        name: doc.name,
        title: doc.title,
        status: doc.status,
        creation: isoToEpoch(doc.creation ?? null),
        modified: isoToEpoch(doc.modified ?? null),
    };
}

type ResourceGetResponse<T> = { data: T };

async function fetchFormStrict(name: string): Promise<DLForm> {
    const url = `${env.frappeUrl}/api/resource/${encodeURIComponent(PARENT_DOCTYPE)}/${encodeURIComponent(name)}`;

    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
            // Nudge Frappe to return JSON, not an HTML desk page
            Accept: 'application/json',
            Authorization: `token ${env.frappeToken}`,
        },
    });

    // If HTTP error, surface the server text (often HTML login page or CSRF message)
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch ${PARENT_DOCTYPE} ${name}: ${text}`);
    }

    // Parse JSON safely; if it isn't JSON, read text and throw a clear error
    const raw = await res.text();
    try {
        const json = JSON.parse(raw) as ResourceGetResponse<DLForm>;
        return json.data;
    } catch {
        const snippet = raw.slice(0, 200).replace(/\s+/g, ' ');
        throw new Error(
            `Expected JSON from ${url} but received non-JSON content (first 200 chars): ${snippet}`,
        );
    }
}

/* ---------- repository ---------- */

export function useFrappeFormsRepo(): FormHooksRepository {
    return {
        /** Single read */
        useGet(name: string | null | undefined) {
            // Always call the hook to honor Rules of Hooks.
            // We pass a stable placeholder when name is falsy, and we short-circuit the returned values.
            const safeName = name ?? '__noop__';
            const enabled = Boolean(name);

            const { data, error, isLoading, mutate } = useFrappeGetDoc<DLForm>(
                PARENT_DOCTYPE,
                safeName,
            );

            const detail: FormDetail | undefined = enabled && data ? toDetail(data) : undefined;

            return {
                data: detail,
                isLoading: enabled ? isLoading : false,
                error: (enabled ? (error ?? null) : null) as RepoError,
                mutate: () => {
                    if (enabled) void mutate();
                },
            };
        },

        /** List summaries */
        useList() {
            const { data, error, isLoading, mutate } = useFrappeGetDocList<DLForm>(PARENT_DOCTYPE, {
                fields: ['name', 'title', 'status', 'creation', 'modified'],
                orderBy: { field: 'modified', order: 'desc' },
                limit: 50,
            });

            const summaries: FormSummary[] | undefined = data ? data.map(toSummary) : undefined;

            return {
                data: summaries,
                isLoading,
                error: (error ?? null) as RepoError,
                mutate: () => {
                    void mutate();
                },
            };
        },

        /** Create/Update with versioning */
        useUpsert() {
            const {
                createDoc,
                loading: creating,
                error: createErr,
                isCompleted: createDone,
                reset: createReset,
            } = useFrappeCreateDoc<DLForm>();
            const {
                updateDoc,
                loading: updating,
                error: updateErr,
                isCompleted: updateDone,
                reset: updateReset,
            } = useFrappeUpdateDoc<DLForm>();

            return {
                async upsert(input: UpsertInput): Promise<{ name: string }> {
                    const incomingNormalized = normalizeSchemaText(input.schemaJSON ?? '{}');

                    if (!input.name) {
                        // CREATE parent with Version 1
                        const initialVersion: DLFormVersion = {
                            version: 1,
                            schema_json: incomingNormalized,
                            changelog: input.changelog ?? 'Initial',
                        };

                        const defaultStatus: DLFormStatus = 'Draft';

                        // Build a creation payload (no name on purpose — Frappe assigns it)
                        const payload: Omit<DLForm, 'name'> & { name?: string } = {
                            title: input.title,
                            status: defaultStatus,
                            schema_json: incomingNormalized,
                            current_version: 1,
                            versions: [initialVersion],
                            // Optional/nullable fields:
                            slug: input.slug ?? null,
                            published_on: null,
                            // System fields the server will fill:
                            creation: undefined as unknown as string,
                            modified: undefined as unknown as string,
                            owner: undefined as unknown as string,
                            modified_by: undefined as unknown as string,
                        };

                        // The SDK’s generic expects DLForm; cast once, with no `any`.
                        const created = await createDoc(
                            PARENT_DOCTYPE,
                            payload as unknown as DLForm,
                        );
                        return { name: created.name };
                    }

                    // UPDATE existing: fetch current, compare schema, and append version if changed
                    const parentName = input.name;
                    const current = await fetchFormStrict(parentName);

                    const currentParentSchema = asSchemaText(current.schema_json);
                    const schemaChanged =
                        normalizeSchemaText(currentParentSchema) !== incomingNormalized;

                    if (schemaChanged) {
                        const nextVerNum = current.current_version + 1;

                        const newVersion: DLFormVersion = {
                            version: nextVerNum,
                            schema_json: incomingNormalized,
                            changelog: input.changelog ?? 'Update',
                        };

                        const nextVersions: DLFormVersion[] = [
                            ...(current.versions ?? []),
                            newVersion,
                        ];

                        const updatePayload: Partial<DLForm> = {
                            title: input.title,
                            schema_json: incomingNormalized,
                            current_version: nextVerNum,
                            versions: nextVersions,
                        };

                        if (input.slug !== undefined) {
                            updatePayload.slug = input.slug ?? current.slug ?? null;
                        }

                        const updated = await updateDoc(PARENT_DOCTYPE, parentName, updatePayload);
                        return { name: updated.name };
                    }

                    // No schema change → keep version; still sync title/slug/schema on parent
                    const syncPayload: Partial<DLForm> = {
                        title: input.title,
                        schema_json: incomingNormalized,
                    };
                    if (input.slug !== undefined) {
                        syncPayload.slug = input.slug ?? current.slug ?? null;
                    }

                    const updated = await updateDoc(PARENT_DOCTYPE, parentName, syncPayload);
                    return { name: updated.name };
                },

                loading: creating || updating,
                error: (createErr ?? updateErr ?? null) as RepoError,
                isCompleted: createDone || updateDone,
                reset() {
                    createReset();
                    updateReset();
                },
            };
        },

        /** Delete */
        useRemove() {
            const { deleteDoc, loading, error, isCompleted, reset } = useFrappeDeleteDoc();
            return {
                async remove(name: string): Promise<void> {
                    await deleteDoc(PARENT_DOCTYPE, name);
                },
                loading,
                error: (error ?? null) as RepoError,
                isCompleted,
                reset,
            };
        },
    };
}
