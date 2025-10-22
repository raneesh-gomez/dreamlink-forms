export type LocalResponseRecord = {
    id: string;
    submittedAt: number;
    data: Record<string, unknown>;
};

const key = (formId: string) => `dl-resp-${formId}`;

export function getResponses(formId: string): LocalResponseRecord[] {
    try {
        const raw = localStorage.getItem(key(formId));
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function addResponse(formId: string, rec: LocalResponseRecord) {
    const list = getResponses(formId);
    list.push(rec);
    localStorage.setItem(key(formId), JSON.stringify(list));
}

export function clearResponses(formId: string) {
    localStorage.removeItem(key(formId));
}
