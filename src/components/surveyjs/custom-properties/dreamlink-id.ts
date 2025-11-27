import { Serializer } from 'survey-core';

// Hardcoded array of DreamLink IDs
const DREAMLINK_ID_CHOICES = [
    { value: 'dl-001', text: 'DreamLink ID 001' },
    { value: 'dl-002', text: 'DreamLink ID 002' },
    { value: 'dl-003', text: 'DreamLink ID 003' },
    { value: 'dl-004', text: 'DreamLink ID 004' },
    { value: 'dl-005', text: 'DreamLink ID 005' },
    { value: 'dl-006', text: 'DreamLink ID 006' },
    { value: 'dl-007', text: 'DreamLink ID 007' },
    { value: 'dl-008', text: 'DreamLink ID 008' },
    { value: 'dl-009', text: 'DreamLink ID 009' },
    { value: 'dl-010', text: 'DreamLink ID 010' },
];

/**
 * Initialize the DreamLink ID custom property for all questions.
 * This property will be available in Survey Creator's Property Grid
 * under the "General" category for all question types.
 */
export function initializeDreamLinkIdProperty() {
    Serializer.addProperty('question', {
        name: 'dreamlinkId',
        displayName: 'DreamLink ID',
        type: 'dropdown',
        category: 'general',
        visibleIndex: 1, // Show near the top of the General category
        choices: DREAMLINK_ID_CHOICES,
        default: null, // Optional property
    });
}
