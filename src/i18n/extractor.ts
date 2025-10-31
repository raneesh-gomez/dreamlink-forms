// src/i18n/extractor.ts
import crypto from 'crypto-js/sha1';

import { makeKey } from './keys';

export type I18nEntry = { key: string; source: string; checksum: string };

const TRANSLATABLE_KEYS = new Set([
    'title',
    'description',
    'placeholder',
    'text',
    'html',
    'tooltip',
    'label',
    'emptyText',
    'comment',
    'commentText',
    'page_title',
    'page_description',
    // add more if you use them (validators/messages, completedHtml, etc.)
]);

export function extractTranslatables(surveyJson: any, surveySlug: string): I18nEntry[] {
    const out: I18nEntry[] = [];
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
                if (typeof v === 'string' && v.trim() && TRANSLATABLE_KEYS.has(k)) {
                    const key = makeKey(surveySlug, p);
                    const checksum = crypto(v).toString();
                    out.push({ key, source: v, checksum });
                }
                visit(v, p);
            }
        }
    };
    visit(surveyJson, []);
    // de-dup by key (prefer the first occurrence)
    const seen = new Set<string>();
    return out.filter(({ key }) => (seen.has(key) ? false : (seen.add(key), true)));
}

/** Merge new extraction with previous en.json (if provided) and produce a diff-only map. */
export function diffEntries(
    current: I18nEntry[],
    previous?: Record<string, { source: string; checksum: string }>,
) {
    const addedOrChanged: Record<string, { source: string; checksum: string }> = {};
    for (const e of current) {
        const prev = previous?.[e.key];
        if (!prev || prev.checksum !== e.checksum) {
            addedOrChanged[e.key] = { source: e.source, checksum: e.checksum };
        }
    }
    return addedOrChanged;
}

/** Convert flat entries to an en.json object shape for storage. */
export function toEnJson(entries: I18nEntry[]) {
    const obj: Record<string, { source: string; checksum: string }> = {};
    for (const e of entries) obj[e.key] = { source: e.source, checksum: e.checksum };
    return obj;
}
