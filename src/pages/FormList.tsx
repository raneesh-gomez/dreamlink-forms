import { ClipboardCheck, PenSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import { useConfirm } from '@/hooks/use-confirm';
import { formatCreatedTime } from '@/lib/date-time-utils';

export default function FormList() {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { mode, repo } = useFormRepositoryContext();

    const { data: forms, isLoading, mutate } = repo.useList();
    const { remove } = repo.useRemove();

    const handleDelete = async (name: string) => {
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
    };

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
