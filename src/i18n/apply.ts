// src/i18n/apply.ts
import { makeKey } from './keys';

export type LocaleDict = Record<string, string>;

export function applyTranslations(surveyJson: any, surveySlug: string, dict: LocaleDict) {
    const clone = structuredClone(surveyJson);
    const visit = (node: any, path: (string | number)[]) => {
        if (node == null) return;
        if (typeof node === 'string') return;
        if (Array.isArray(node)) {
            node.forEach((v, i) => visit(v, [...path, i]));
            return;
        }
        if (typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                const p = [...path, k];
                if (typeof v === 'string') {
                    const key = makeKey(surveySlug, p);
                    if (dict[key]) (node as any)[k] = dict[key];
                }
                visit(v, p);
            }
        }
    };
    visit(clone, []);
    return clone;
}
