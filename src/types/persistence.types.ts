// src/persistence/types.ts
import type { FrappeError } from 'frappe-react-sdk';

export type PersistMode = 'local' | 'frappe';

/* Local Storage record type */
export type LSRecord = {
    name: string;
    title: string;
    status?: string;
    schema_json: string;
    creation: number; // epoch
    modified: number; // epoch
};

export interface FormSummary {
    name: string; // DL Form name or local key
    title: string;
    status?: string | null;
    creation: number; // epoch ms
    modified: number; // epoch ms
}

export interface FormDetail extends FormSummary {
    schemaJSON: string;
}

export interface UpsertInput {
    name?: string | null;
    title: string;
    slug?: string | null;
    schemaJSON: string;
    changelog?: string;
}

export type RepoError = FrappeError | Error | null | undefined;

export interface FormHooksRepository {
    /** List forms */
    useList(): {
        data: FormSummary[] | undefined;
        isLoading: boolean;
        error: RepoError;
        mutate: () => void;
    };

    /** Get single form */
    useGet(name: string | null | undefined): {
        data: FormDetail | undefined;
        isLoading: boolean;
        error: RepoError;
        mutate: () => void;
    };

    /** Create/Update */
    useUpsert(): {
        upsert(input: UpsertInput): Promise<{ name: string }>;
        loading: boolean;
        error: RepoError;
        isCompleted: boolean;
        reset(): void;
    };

    /** Delete */
    useRemove(): {
        remove(name: string): Promise<void>;
        loading: boolean;
        error: RepoError;
        isCompleted: boolean;
        reset(): void;
    };
}
