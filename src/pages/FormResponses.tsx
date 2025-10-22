import { useMemo, useState } from 'react';

import { ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { type LocalResponseRecord, clearResponses, getResponses } from '@/lib/responses-local';

function formatDateTime(ts: number) {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function toCsv(rows: Array<Record<string, unknown>>, delimiter = ',') {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
        const str = v == null ? '' : String(v);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const header = headers.map(escape).join(delimiter);
    const lines = rows.map((r) => headers.map((h) => escape(r[h])).join(delimiter));
    return [header, ...lines].join('\n');
}

export default function FormResponses() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const confirm = useConfirm();

    // client-side pagination, sorting
    const [refreshTick, setRefreshTick] = useState(0);
    const [sortNewestFirst, setSortNewestFirst] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 25;

    const formTitle = useMemo(() => {
        const json = id ? localStorage.getItem(`dl-form-${id}`) : null;
        try {
            const parsed = json ? JSON.parse(json) : null;
            return parsed?.title || 'Untitled Form';
        } catch {
            return 'Untitled Form';
        }
    }, [id]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const raw = useMemo(() => (id ? getResponses(id) : []), [id, refreshTick]);

    const sorted: LocalResponseRecord[] = useMemo(() => {
        const list = [...raw];
        list.sort((a, b) =>
            sortNewestFirst ? b.submittedAt - a.submittedAt : a.submittedAt - b.submittedAt,
        );
        return list;
    }, [raw, sortNewestFirst]);

    const total = sorted.length;
    // const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageStart = (page - 1) * pageSize;
    const pageSlice = sorted.slice(pageStart, pageStart + pageSize);

    // dynamic columns from union of keys (answers) + submittedAt
    const { columns, tableRows } = useMemo(() => {
        const keys = new Set<string>(['submittedAt']);
        pageSlice.forEach((r) => Object.keys(r.data || {}).forEach((k) => keys.add(k)));
        const cols = Array.from(keys);

        const rows = pageSlice.map((r) => {
            const row: Record<string, unknown> = {};
            for (const k of cols) {
                if (k === 'submittedAt') row[k] = formatDateTime(r.submittedAt);
                else {
                    const v = r.data?.[k];
                    row[k] = typeof v === 'object' ? JSON.stringify(v) : (v ?? '');
                }
            }
            return row;
        });

        return { columns: cols, tableRows: rows };
    }, [pageSlice]);

    const handleExportCsv = () => {
        const csv = toCsv(tableRows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formTitle || 'form'}-responses-page-${page}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRefresh = () => setRefreshTick((t) => t + 1);

    const handleClearAll = async () => {
        if (!id) return;
        const ok = await confirm({
            title: 'Clear all responses?',
            description: 'This will permanently delete all responses for this form.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (!ok) return;
        clearResponses(id);
        handleRefresh();
        setPage(1);
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header Row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="gap-2 hover:cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{formTitle} — Responses</h1>
                        <span className="text-sm rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                            {total} total
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setSortNewestFirst((v) => !v)}
                        className="gap-2 hover:cursor-pointer"
                        title="Toggle sort order"
                    >
                        {sortNewestFirst ? 'Newest first' : 'Oldest first'}
                    </Button>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        className="gap-2 hover:cursor-pointer"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleExportCsv}
                        className="gap-2 hover:cursor-pointer"
                        disabled={tableRows.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        onClick={handleClearAll}
                        variant="destructive"
                        className="gap-2 hover:cursor-pointer"
                        disabled={total === 0}
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            </div>

            {total === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                    No responses yet. Submit the form to see responses here.
                </div>
            ) : (
                <div className="overflow-auto rounded-lg border">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b"
                                    >
                                        {col === 'submittedAt' ? 'Submitted At' : col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, idx) => (
                                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                    {columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-3 py-2 text-sm text-gray-800 border-b align-top"
                                        >
                                            {String(row[col] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {total > pageSize && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            disabled={page >= Math.ceil(total / pageSize)}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
