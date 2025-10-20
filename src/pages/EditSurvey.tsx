import { useEffect, useState } from 'react';

import { RotateCcw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import 'survey-core/survey-core.css';
import { type ICreatorOptions } from 'survey-creator-core';
import 'survey-creator-core/survey-creator-core.css';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';

import './EditSurvey.css';

const creatorOptions: ICreatorOptions = {
    autoSaveEnabled: true,
    collapseOnDrag: true,
};

export default function EditSurvey() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [creator] = useState<SurveyCreator>(() => new SurveyCreator(creatorOptions));
    const [hasChanges, setHasChanges] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [originalJson, setOriginalJson] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | null>(null);

    useEffect(() => {
        // Load the survey
        const surveyJson = localStorage.getItem(`survey-${id}`);
        if (surveyJson) {
            creator.text = surveyJson;
            setOriginalJson(surveyJson);
        } else {
            // If survey not found, redirect to surveys list
            navigate('/surveys');
        }
    }, [id, navigate, creator]);

    useEffect(() => {
        let autoSaveTimerId: ReturnType<typeof setTimeout>;
        let clearStatusTimerId: ReturnType<typeof setTimeout>;

        const handleChange = () => {
            const currentJson = creator.text;
            const hasChanged = currentJson !== originalJson;
            setHasChanges(hasChanged);

            // Clear any pending timers
            clearTimeout(autoSaveTimerId);
            clearTimeout(clearStatusTimerId);

            if (hasChanged) {
                setSaveStatus('saving');

                // Set new auto-save timer (debounce for 500ms)
                autoSaveTimerId = setTimeout(() => {
                    try {
                        if (id) {
                            localStorage.setItem(`survey-${id}`, currentJson);
                            setOriginalJson(currentJson);
                            setHasChanges(false);
                            setSaveStatus('saved');

                            // Ensure the saved status stays visible for at least 3 seconds
                            clearTimeout(clearStatusTimerId);
                            clearStatusTimerId = setTimeout(() => {
                                setSaveStatus(null);
                            }, 3000);
                        }
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                        setSaveStatus(null);
                    }
                }, 500);
            } else {
                setSaveStatus(null);
            }
        };

        // Subscribe to both text changes and property value changes
        creator.onModified.add(handleChange);
        creator.onPropertyChanged.add(handleChange);

        const cleanup = () => {
            creator.onModified.remove(handleChange);
            creator.onPropertyChanged.remove(handleChange);
            clearTimeout(autoSaveTimerId);
            clearTimeout(clearStatusTimerId);
            setSaveStatus(null);
        };

        return cleanup;
    }, [creator, originalJson, id]);

    const showNoChangesToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleSave = () => {
        const shouldNavigate = confirm('Would you like to go back to the surveys list?');
        if (shouldNavigate) {
            navigate('/surveys');
        }
    };

    const handleReset = () => {
        if (!hasChanges) {
            showNoChangesToast();
            return;
        }

        if (
            confirm(
                'Are you sure you want to reset your changes? All unsaved changes will be lost.',
            )
        ) {
            creator.text = originalJson;
            setHasChanges(false);
        }
    };

    // Override the default save function
    creator.saveSurveyFunc = (saveNo: number, callback: (num: number, status: boolean) => void) => {
        // We don't want to automatically save and redirect on auto-save
        // Just acknowledge the save request from the creator
        callback(saveNo, true);
    };

    return (
        <div
            className="relative flex flex-col"
            style={{ height: 'calc(100vh - 64px)', width: '100%' }}
        >
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Edit Survey</h2>
                    {saveStatus === 'saving' && (
                        <span className="text-sm text-gray-500 animate-fadeIn">
                            Changes are being saved...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-sm text-gray-500 animate-fadeIn">
                            Latest changes have been saved
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                            hasChanges
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Save size={20} />
                        Finish Survey
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                            hasChanges
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <RotateCcw size={20} />
                        Reset Changes
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <SurveyCreatorComponent creator={creator} />
            </div>

            {showToast && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
                    No changes have been made to save or reset
                </div>
            )}
        </div>
    );
}
