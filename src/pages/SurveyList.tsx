import { useEffect, useState } from 'react';

import { PenSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Survey {
    id: string;
    json: string;
    timestamp: number;
}

export default function SurveyList() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Get all survey keys from localStorage
        const allKeys = Object.keys(localStorage);
        const surveyKeys = allKeys.filter((key) => key.startsWith('survey-'));

        // Load all surveys
        const loadedSurveys = surveyKeys.map((key) => {
            const json = localStorage.getItem(key);
            return {
                id: key.replace('survey-', ''),
                json: json || '',
                timestamp: parseInt(key.split('-')[2] || '0'),
            };
        });

        // Sort by timestamp (newest first)
        loadedSurveys.sort((a, b) => b.timestamp - a.timestamp);
        setSurveys(loadedSurveys);
    }, []);

    const handleSurveyClick = (surveyId: string) => {
        navigate(`/surveys/${surveyId}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Surveys</h1>
            {surveys.length === 0 ? (
                <p className="text-center text-gray-500">
                    No surveys created yet. Start by creating a new survey!
                </p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {surveys.map((survey) => {
                        const surveyData = JSON.parse(survey.json);
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
                                        {surveyData.title || 'Untitled Survey'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Created: {new Date(survey.timestamp).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/surveys/${survey.id}/edit`);
                                        }}
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Edit Survey"
                                    >
                                        <PenSquare size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                                window.confirm(
                                                    'Are you sure you want to delete this survey? This action cannot be undone.',
                                                )
                                            ) {
                                                localStorage.removeItem(`survey-${survey.id}`);
                                                setSurveys(
                                                    surveys.filter((s) => s.id !== survey.id),
                                                );
                                            }
                                        }}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Survey"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
