// src/persistence/frappe-hooks-repo.tsx
import { useMemo } from 'react';

import {
    type FrappeDoc,
    type FrappeError,
    useFrappeCreateDoc,
    useFrappeDeleteDoc,
    useFrappeGetDoc,
    useFrappeGetDocList,
    useFrappeUpdateDoc,
} from 'frappe-react-sdk';

import type { DLForm } from '@/types/frappe.types';
import type {
    FormDetail,
    FormHooksRepository,
    FormSummary,
    UpsertInput,
} from '@/types/persistence.types';

const toEpoch = (iso?: string | null): number => (iso ? new Date(iso).getTime() : Date.now());

const schemaToString = (v: DLForm['schema_json']): string =>
    typeof v === 'string' ? v : JSON.stringify(v ?? {});

const toSummary = (doc: FrappeDoc<DLForm>): FormSummary => ({
    name: doc.name,
    title: doc.title,
    status: doc.status ?? null,
    creation: toEpoch(doc.creation),
    modified: toEpoch(doc.modified),
});

const toDetail = (doc: FrappeDoc<DLForm>): FormDetail => ({
    ...toSummary(doc),
    schemaJSON: schemaToString(doc.schema_json),
});

export function useFrappeFormsRepo(): FormHooksRepository {
    return {
        useList() {
            // ✅ Ask the hook for FrappeDoc<DLForm> rows
            const { data, error, isValidating, mutate } = useFrappeGetDocList<FrappeDoc<DLForm>>(
                'DL Form',
                {
                    fields: ['name', 'title', 'status', 'creation', 'modified'],
                    orderBy: { field: 'modified', order: 'desc' },
                },
            );

            const mapped = useMemo<FormSummary[] | undefined>(
                () => (data ? data.map(toSummary) : undefined),
                [data],
            );

            return {
                data: mapped,
                isLoading: !data && isValidating,
                error,
                mutate: () => void mutate(),
            };
        },

        useGet(name) {
            const enabled = Boolean(name);
            // useFrappeGetDoc<T> already returns SWRResponse<FrappeDoc<T>>
            const { data, error, isValidating, mutate } = useFrappeGetDoc<DLForm>(
                'DL Form',
                enabled ? name! : undefined,
            );

            const mapped = useMemo<FormDetail | undefined>(
                () => (data ? toDetail(data) : undefined),
                [data],
            );

            return {
                data: mapped,
                isLoading: enabled && !data && isValidating,
                error,
                mutate: () => void mutate(),
            };
        },

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
                    const payload: Partial<DLForm> = {
                        title: input.title || 'Untitled Form',
                        slug: input.slug ?? null,
                        schema_json: input.schemaJSON,
                    };

                    if (!input.name) {
                        const created = await createDoc('DL Form', payload as DLForm);
                        return { name: created.name };
                    }
                    const updated = await updateDoc('DL Form', input.name, payload);
                    return { name: updated.name };
                },
                loading: creating || updating,
                error: (createErr ?? updateErr) as FrappeError | null | undefined,
                isCompleted: createDone || updateDone,
                reset() {
                    createReset();
                    updateReset();
                },
            };
        },

        useRemove() {
            const { deleteDoc, loading, error, isCompleted, reset } = useFrappeDeleteDoc();
            return {
                async remove(name: string): Promise<void> {
                    await deleteDoc('DL Form', name);
                },
                loading,
                error,
                isCompleted,
                reset,
            };
        },
    };
}
