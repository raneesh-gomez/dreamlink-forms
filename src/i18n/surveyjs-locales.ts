// src/i18n/surveyjs-locales.ts
import { type ILocalizableString, surveyLocalization } from 'survey-core';
import { editorLocalization } from 'survey-creator-core';

/** Loosely-typed shapes for locales */
type SurveyLocale = Partial<ILocalizableString> & Record<string, any>;
type CreatorLocale = Record<string, any>;

// Example Sinhala strings — extend as needed
const siSurvey: SurveyLocale = {
    pagePrevText: 'පසුපසට',
    pageNextText: 'ඊළඟ',
    completeText: 'සම්පූර්ණ',
    // ... add more Survey runtime UI strings you care about
};

const siCreator: CreatorLocale = {
    // Example: label for your custom question in the Creator palette
    qt: { 'location-picker': 'Location Picker' },
    // ... add more Survey Creator UI strings you need
};

export function ensureSurveyLocale(locale: string) {
    // Cast locales so TS allows string index access
    const locales = surveyLocalization.locales as Record<string, SurveyLocale>;
    if (!locales[locale]) {
        locales[locale] = { ...siSurvey };
    }
}

export function ensureCreatorLocale(locale: string) {
    const locales = editorLocalization.locales as Record<string, CreatorLocale>;
    if (!locales[locale]) {
        locales[locale] = { ...siCreator };
    }
}
