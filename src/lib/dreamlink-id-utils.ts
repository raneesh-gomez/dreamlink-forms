/**
 * Example: Accessing DreamLink ID from questions
 *
 * This file demonstrates how to work with the dreamlinkId custom property
 * in your survey logic.
 */
import type { Question, SurveyModel } from 'survey-core';

/**
 * Get the DreamLink ID from a specific question
 */
export function getDreamlinkId(question: Question): string | null {
    return (question as any).dreamlinkId || null;
}

/**
 * Get all questions with their DreamLink IDs
 */
export function getAllQuestionDreamlinkIds(survey: SurveyModel): Array<{
    name: string;
    title: string;
    dreamlinkId: string | null;
}> {
    return survey.getAllQuestions().map((question) => ({
        name: question.name,
        title: question.title,
        dreamlinkId: getDreamlinkId(question),
    }));
}

/**
 * Find a question by its DreamLink ID
 */
export function findQuestionByDreamlinkId(
    survey: SurveyModel,
    dreamlinkId: string,
): Question | null {
    return survey.getAllQuestions().find((q) => getDreamlinkId(q) === dreamlinkId) || null;
}

/**
 * Group questions by their DreamLink ID
 */
export function groupQuestionsByDreamlinkId(survey: SurveyModel): Map<string, Question[]> {
    const groups = new Map<string, Question[]>();

    survey.getAllQuestions().forEach((question) => {
        const id = getDreamlinkId(question);
        if (id) {
            if (!groups.has(id)) {
                groups.set(id, []);
            }
            groups.get(id)!.push(question);
        }
    });

    return groups;
}

/**
 * Validate that all questions have a DreamLink ID (if required)
 */
export function validateDreamlinkIds(survey: SurveyModel): {
    valid: boolean;
    questionsWithoutId: Question[];
} {
    const questionsWithoutId = survey.getAllQuestions().filter((q) => !getDreamlinkId(q));

    return {
        valid: questionsWithoutId.length === 0,
        questionsWithoutId,
    };
}
