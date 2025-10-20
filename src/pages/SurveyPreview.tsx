import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';
import { Model } from 'survey-core';
import 'survey-core/survey-core.min.css';
import { Survey } from 'survey-react-ui';

export default function SurveyPreview() {
    const { id } = useParams<{ id: string }>();
    const [model, setModel] = useState<Model | null>(null);

    useEffect(() => {
        if (id) {
            const surveyJson = localStorage.getItem(`survey-${id}`);
            if (surveyJson) {
                const surveyData = JSON.parse(surveyJson);
                const survey = new Model(surveyData);
                setModel(survey);
            }
        }
    }, [id]);

    if (!model) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-500">Loading survey...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Survey model={model} />
        </div>
    );
}
