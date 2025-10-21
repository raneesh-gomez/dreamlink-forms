import { useEffect, useState } from 'react';

import { PenSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { formatCreatedTime } from '@/lib/date-time-utils';

// ⬅️ shadcn

interface Survey {
    id: string;
    json: string;
    timestamp: number;
}

export default function SurveyList() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const navigate = useNavigate();
    const confirm = useConfirm();

    useEffect(() => {
        const allKeys = Object.keys(localStorage);
        const surveyKeys = allKeys.filter((key) => key.startsWith('survey-'));

        const loadedSurveys: Survey[] = surveyKeys.map((key) => {
            const json = localStorage.getItem(key);
            const parts = key.split('-');
            const timestamp = Number(parts[2]) || Number(parts[1]) || 0;
            return {
                id: key.replace('survey-', ''),
                json: json || '',
                timestamp,
            };
        });

        loadedSurveys.sort((a, b) => b.timestamp - a.timestamp);
        setSurveys(loadedSurveys);
    }, []);

    const handleSurveyClick = (surveyId: string) => {
        navigate(`/forms/${surveyId}`);
    };

    const handleDelete = async (surveyId: string) => {
        const ok = await confirm({
            title: 'Delete this survey?',
            description: 'This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'destructive',
        });
        if (!ok) return;

        localStorage.removeItem(`survey-${surveyId}`);
        setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Forms</h1>
            {surveys.length === 0 ? (
                <p className="text-center text-gray-500">
                    No surveys created yet. Start by creating a new survey!
                </p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {surveys.map((survey) => {
                        const surveyData = JSON.parse(survey.json || '{}');
                        return (
                            <div
                                key={survey.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                            >
                                <div
                                    onClick={() => handleSurveyClick(survey.id)}
                                    className="cursor-pointer"
                                >
                                    <h2 className="text-lg font-semibold mb-2">
                                        {surveyData.title || 'Untitled Form'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Created: {formatCreatedTime(survey.timestamp)}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/forms/${survey.id}/edit`);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        title="Edit Survey"
                                        aria-label="Edit survey"
                                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:cursor-pointer"
                                    >
                                        <PenSquare className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await handleDelete(survey.id);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        title="Delete Survey"
                                        aria-label="Delete survey"
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
