export type DLFormStatus = 'Draft' | 'Published' | 'Archived';

export interface DLFormVersion {
    doctype?: string;
    name?: string;
    parent?: string;
    parentfield?: string; // "versions"
    parenttype?: string; // "DL Form"
    idx?: number;

    version: number;
    schema_json: string | Record<string, unknown>;
    changelog?: string | null;
}

export interface DLForm {
    // Standard fields
    name: string;
    owner?: string | null;
    creation?: string | null; // ISO datetime
    modified?: string | null; // ISO datetime
    modified_by?: string | null;

    // Your fields
    title: string;
    slug?: string | null;
    status: DLFormStatus;
    schema_json: string | Record<string, unknown>;
    current_version: number;
    published_on?: string | null;

    versions?: DLFormVersion[];
}
