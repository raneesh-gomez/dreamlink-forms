import { useCallback, useEffect, useState } from 'react';

import type {
    FormDetail,
    FormHooksRepository,
    FormSummary,
    RepoError,
    UpsertInput,
} from '@/types/persistence.types';

const PREFIX = 'dl-form-';

const toSummary = (name: string, jsonText: string, timestamp: number): FormSummary => {
    const schema = JSON.parse(jsonText || '{}');
    return {
        name,
        title: schema?.title ?? 'Untitled Form',
        status: null,
        creation: timestamp || Date.now(),
        modified: timestamp || Date.now(),
    };
};

export function useLocalFormsRepo(): FormHooksRepository {
    return {
        useList() {
            const [data, setData] = useState<FormSummary[]>();
            const [error, setError] = useState<RepoError>();
            const [loading, setLoading] = useState<boolean>(true);

            const load = useCallback(() => {
                try {
                    setLoading(true);
                    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
                    const rows = keys
                        .map((k) => {
                            const json = localStorage.getItem(k) ?? '';
                            const parts = k.split('-');
                            const ts = Number(parts[2]) || Number(parts[1]) || Date.now();
                            const name = k.replace(PREFIX, '');
                            return toSummary(name, json, ts);
                        })
                        .sort((a, b) => b.modified - a.modified);
                    setData(rows);
                    setError(null);
                } catch (e) {
                    setError(e as RepoError);
                } finally {
                    setLoading(false);
                }
            }, []);

            useEffect(() => {
                load();
            }, [load]);

            return {
                data,
                isLoading: loading,
                error,
                mutate: load,
            };
        },

        useGet(name) {
            const [detail, setDetail] = useState<FormDetail>();
            const [error, setError] = useState<RepoError>();
            const [loading, setLoading] = useState<boolean>(true);

            const load = useCallback(() => {
                try {
                    setLoading(true);
                    if (!name) {
                        setDetail(undefined);
                        setError(new Error('Missing name'));
                        return;
                    }
                    const raw = localStorage.getItem(`${PREFIX}${name}`);
                    if (!raw) {
                        setDetail(undefined);
                        setError(new Error('Not found'));
                        return;
                    }
                    const parts = `${PREFIX}${name}`.split('-');
                    const ts = Number(parts[2]) || Number(parts[1]) || Date.now();
                    const summary = toSummary(name, raw, ts);
                    setDetail({ ...summary, schemaJSON: raw });
                    setError(null);
                } catch (e) {
                    setError(e as Error);
                } finally {
                    setLoading(false);
                }
            }, [name]);

            useEffect(() => {
                load();
            }, [load]);

            return {
                data: detail,
                isLoading: loading,
                error,
                mutate: load,
            };
        },

        useUpsert() {
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState<RepoError>();
            const [done, setDone] = useState(false);

            return {
                async upsert(input: UpsertInput): Promise<{ name: string }> {
                    setLoading(true);
                    setError(null);
                    setDone(false);
                    try {
                        const name = input.name ?? `${Date.now()}`;
                        localStorage.setItem(`${PREFIX}${name}`, input.schemaJSON);
                        setDone(true);
                        return { name };
                    } catch (e) {
                        setError(e as RepoError);
                        throw e;
                    } finally {
                        setLoading(false);
                    }
                },
                loading,
                error,
                isCompleted: done,
                reset() {
                    setLoading(false);
                    setError(null);
                    setDone(false);
                },
            };
        },

        useRemove() {
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState<RepoError>();
            const [done, setDone] = useState(false);

            return {
                async remove(name: string): Promise<void> {
                    setLoading(true);
                    setError(null);
                    setDone(false);
                    try {
                        localStorage.removeItem(`${PREFIX}${name}`);
                        setDone(true);
                    } catch (e) {
                        setError(e as RepoError);
                        throw e;
                    } finally {
                        setLoading(false);
                    }
                },
                loading,
                error,
                isCompleted: done,
                reset() {
                    setLoading(false);
                    setError(null);
                    setDone(false);
                },
            };
        },
    };
}
