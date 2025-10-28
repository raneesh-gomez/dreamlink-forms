import { useCallback, useRef, useState } from 'react';

import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';

import type { DLForm, DLFormVersion } from '@/types/frappe.types';
import type { UpsertInput } from '@/types/persistence.types';

function toStringJson(value: unknown): string {
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value ?? {});
    } catch {
        return '{}';
    }
}
export function useDlForm(initialName?: string | null) {
    const [docname, setDocname] = useState<string | null>(initialName ?? null);
    // SWR hook: mutate returns DLForm | undefined (not { data })
    const { data: doc, mutate } = useFrappeGetDoc<DLForm>('DL Form', docname ?? '', {
        enabled: Boolean(docname),
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });
    // IMPORTANT: create/update as Partial<DLForm>
    const { createDoc, loading: creating } = useFrappeCreateDoc<Partial<DLForm>>();
    const { updateDoc, loading: updating } = useFrappeUpdateDoc<Partial<DLForm>>();
    const savingRef = useRef(false);
    const upsert = useCallback(
        async (input: UpsertInput) => {
            if (savingRef.current) return;
            savingRef.current = true;
            try {
                if (!docname) {
                    // CREATE
                    const versionRow: DLFormVersion = {
                        doctype: 'DL Form Version',
                        version: 1,
                        schema_json: input.schemaJSON,
                        changelog: input.changelog ?? 'Initial',
                    };
                    const res = await createDoc('DL Form', {
                        title: input.title || 'Untitled Form',
                        slug: input.slug ?? null,
                        status: 'Draft',
                        schema_json: toStringJson(input.schemaJSON),
                        current_version: 1,
                        versions: [versionRow],
                    });
                    setDocname(res.name); // Frappe assigns name
                    await mutate(); // revalidate and update `doc`
                    return res;
                } else {
                    // UPDATE + append child row
                    // Get the latest doc (mutate returns DLForm | undefined)
                    const latest = await mutate(); // trigger revalidate; returns latest doc
                    const cur = latest ?? doc;
                    const nextVersion = (cur?.current_version ?? 0) + 1;
                    const nextVersions: DLFormVersion[] = [
                        ...(cur?.versions ?? []),
                        {
                            doctype: 'DL Form Version',
                            version: nextVersion,
                            schema_json: input.schemaJSON,
                            changelog: input.changelog ?? 'Autosave',
                        },
                    ];
                    const res = await updateDoc('DL Form', docname, {
                        title: input.title || cur?.title || 'Untitled Form',
                        slug: input.slug ?? cur?.slug ?? null,
                        schema_json: toStringJson(input.schemaJSON),
                        current_version: nextVersion,
                        versions: nextVersions,
                        // optimistic concurrency
                        modified: cur?.modified,
                    });
                    await mutate(); // refresh local cache
                    return res;
                }
            } finally {
                savingRef.current = false;
            }
        },
        [createDoc, updateDoc, docname, mutate, doc],
    );
    return { docname, doc, creating, updating, upsert, refetch: mutate };
}
