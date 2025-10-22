import { useEffect, useState } from 'react';

import { ClipboardCheck, PenSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { formatCreatedTime } from '@/lib/date-time-utils';

interface Form {
    id: string;
    json: string;
    timestamp: number;
}

export default function FormList() {
    const [forms, setForms] = useState<Form[]>([]);
    const navigate = useNavigate();
    const confirm = useConfirm();

    useEffect(() => {
        const allKeys = Object.keys(localStorage);
        const formKeys = allKeys.filter((key) => key.startsWith('dl-form-'));

        const loadedForms: Form[] = formKeys.map((key) => {
            const json = localStorage.getItem(key);
            const parts = key.split('-');
            const timestamp = Number(parts[2]) || Number(parts[1]) || 0;
            return {
                id: key.replace('dl-form-', ''),
                json: json || '',
                timestamp,
            };
        });

        loadedForms.sort((a, b) => b.timestamp - a.timestamp);
        setForms(loadedForms);
    }, []);

    const handleFormClick = (formId: string) => {
        navigate(`/forms/${formId}`);
    };

    const handleDelete = async (formId: string) => {
        const ok = await confirm({
            title: 'Delete this form?',
            description: 'This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (!ok) return;

        localStorage.removeItem(`dl-form-${formId}`);
        setForms((prev) => prev.filter((s) => s.id !== formId));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Forms</h1>
            {forms.length === 0 ? (
                <p className="text-center text-gray-500">
                    No forms created yet. Start by creating a new form!
                </p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form) => {
                        const formData = JSON.parse(form.json || '{}');
                        return (
                            <div
                                key={form.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                            >
                                <div
                                    onClick={() => handleFormClick(form.id)}
                                    className="cursor-pointer"
                                >
                                    <h2 className="text-lg font-semibold mb-2">
                                        {formData.title || 'Untitled Form'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Created: {formatCreatedTime(form.timestamp)}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/forms/${form.id}/responses`);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        title="View Responses"
                                        aria-label="View Responses"
                                        className="text-gray-600 hover:text-green-600 hover:bg-blue-50 hover:cursor-pointer"
                                    >
                                        <ClipboardCheck className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/forms/${form.id}/edit`);
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
                                            await handleDelete(form.id);
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}
