# DreamLink ID Custom Property

## Overview

The **DreamLink ID** is a custom property that has been added to all question types in the SurveyJS Survey Creator. This property appears in the Property Grid under the "General" category and allows you to associate each question with a predefined DreamLink identifier.

## Features

- **Available for all question types**: Both native SurveyJS questions and custom questions
- **Dropdown selection**: Easy-to-use dropdown menu with predefined options
- **Configurable**: Hardcoded list of IDs that can be easily modified
- **Optional property**: No default value is required

## Usage

### In Survey Creator

1. Add any question to your survey (Text, Dropdown, Location Picker, etc.)
2. Select the question to open the Property Grid
3. Look for **"DreamLink ID"** in the General category (near the top)
4. Select an ID from the dropdown menu

### Available DreamLink IDs

The following IDs are currently available:

- DreamLink ID 001 (`dl-001`)
- DreamLink ID 002 (`dl-002`)
- DreamLink ID 003 (`dl-003`)
- DreamLink ID 004 (`dl-004`)
- DreamLink ID 005 (`dl-005`)
- DreamLink ID 006 (`dl-006`)
- DreamLink ID 007 (`dl-007`)
- DreamLink ID 008 (`dl-008`)
- DreamLink ID 009 (`dl-009`)
- DreamLink ID 010 (`dl-010`)

### Accessing the Property in Code

Once a DreamLink ID is assigned to a question, it will be saved in the survey JSON schema:

```json
{
    "elements": [
        {
            "type": "text",
            "name": "question1",
            "title": "What is your name?",
            "dreamlinkId": "dl-001"
        }
    ]
}
```

You can access it programmatically:

```typescript
// In the survey runtime
const dreamlinkId = survey.getQuestionByName('question1').dreamlinkId;

// Or iterate through all questions
survey.getAllQuestions().forEach((question) => {
    console.log(question.name, question.dreamlinkId);
});
```

## Customization

### Modifying the Available IDs

To change the available DreamLink IDs, edit the `DREAMLINK_ID_CHOICES` array in:

```
src/components/surveyjs/custom-properties/dreamlink-id.ts
```

Example:

```typescript
const DREAMLINK_ID_CHOICES = [
    { value: 'custom-id-1', text: 'Custom Label 1' },
    { value: 'custom-id-2', text: 'Custom Label 2' },
    // Add more as needed...
];
```

### Loading IDs Dynamically

If you need to load DreamLink IDs from an API or database, you can modify the property definition to use a `choices` function:

```typescript
Serializer.addProperty('question', {
    name: 'dreamlinkId',
    displayName: 'DreamLink ID',
    type: 'dropdown',
    category: 'general',
    visibleIndex: 1,
    choices: (obj, choicesCallback) => {
        // Fetch from API
        fetch('/api/dreamlink-ids')
            .then((response) => response.json())
            .then((data) => {
                const choices = [{ value: null, text: 'None' }, ...data];
                choicesCallback(choices);
            });
    },
});
```

## Implementation Details

- **File**: `src/components/surveyjs/custom-properties/dreamlink-id.ts`
- **Initialization**: Called in `CreateForm.tsx` and `EditForm.tsx` when the creator is mounted
- **Base class**: Added to the `"question"` class, so it inherits to all question types
- **Property type**: `dropdown` with predefined choices
- **Category**: `general` (appears in the General settings section)
- **Default value**: `null` (optional, no pre-selection)

## Technical Reference

This implementation follows the SurveyJS documentation for adding custom properties:

- [Add Custom Properties to Question Types](https://surveyjs.io/form-library/documentation/customize-question-types/add-custom-properties-to-a-form)
- Uses `Serializer.addProperty()` method
- Targets the base `"question"` class for universal availability
