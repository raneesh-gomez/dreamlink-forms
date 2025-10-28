import { type PropsWithChildren, useMemo, useState } from 'react';

import { useFrappeFormsRepo } from '@/persistence/frappe-repo';
import { useLocalFormsRepo } from '@/persistence/local-repo';
import type { FormHooksRepository, PersistMode } from '@/types/persistence.types';

import { FormRepositoryContext } from './FormRepositoryContext';
import type { FormRepositoryContextProps } from './FormRepositoryContextProps';

/**
 * Exposes a "stable" repository whose hook methods are invoked in a fixed order
 * on every render. We call BOTH backends' hooks and select the active one based
 * on `mode`. This prevents React's "changed the order of Hooks" error when
 * switching persistence backends at runtime.
 */
export function FormRepositoryProvider({
    initial = 'frappe',
    children,
}: PropsWithChildren<{ initial?: PersistMode }>) {
    const [mode, setMode] = useState<PersistMode>(initial);

    // Underlying repos (their own hooks are called unconditionally below).
    const frappe = useFrappeFormsRepo();
    const local = useLocalFormsRepo();

    // Stable wrapper: always call in the SAME order, then return the active result.
    const stableRepo: FormHooksRepository = useMemo(() => {
        return {
            // List
            useList() {
                // Call BOTH, fixed order
                const frappeList = frappe.useList();
                const localList = local.useList();
                return mode === 'frappe' ? frappeList : localList;
            },

            // Get one
            useGet(name: string) {
                const frappeGet = frappe.useGet(name);
                const localGet = local.useGet(name);
                return mode === 'frappe' ? frappeGet : localGet;
            },

            // Upsert
            useUpsert() {
                const frappeUpsert = frappe.useUpsert();
                const localUpsert = local.useUpsert();
                return mode === 'frappe' ? frappeUpsert : localUpsert;
            },

            // Remove
            useRemove() {
                const frappeRemove = frappe.useRemove();
                const localRemove = local.useRemove();
                return mode === 'frappe' ? frappeRemove : localRemove;
            },
        } as FormHooksRepository;
        // Include `mode` so we select the right result on change,
        // but keep underlying calls & order the same each render.
    }, [mode, frappe, local]);

    const value: FormRepositoryContextProps = useMemo(
        () => ({ mode, setMode, repo: stableRepo }),
        [mode, stableRepo],
    );

    return (
        <FormRepositoryContext.Provider value={value}>{children}</FormRepositoryContext.Provider>
    );
}
