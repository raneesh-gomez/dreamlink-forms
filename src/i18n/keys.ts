// src/i18n/keys.ts
export function makeKey(surveySlug: string, path: (string | number)[]) {
    const dotted = path.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');
    return `${surveySlug}.${dotted}`;
}
