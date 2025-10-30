import { Question, QuestionFactory, Serializer } from 'survey-core';
import { getLocaleStrings } from 'survey-creator-core';

import { SurveyJS } from '@/constants';

export class LocationPickerQuestion extends Question {
    getType() {
        return SurveyJS.LOCATION_PICKER_TYPE;
    }

    get defaultLat(): number {
        return this.getPropertyValue('defaultLat');
    }
    set defaultLat(v: number) {
        this.setPropertyValue('defaultLat', v);
    }

    get defaultLng(): number {
        return this.getPropertyValue('defaultLng');
    }
    set defaultLng(v: number) {
        this.setPropertyValue('defaultLng', v);
    }

    get defaultZoom(): number {
        return this.getPropertyValue('defaultZoom');
    }
    set defaultZoom(v: number) {
        this.setPropertyValue('defaultZoom', v);
    }
}

Serializer.addClass(
    SurveyJS.LOCATION_PICKER_TYPE,
    [
        { name: 'defaultLat:number', default: 6.9271 },
        { name: 'defaultLng:number', default: 79.8612 },
        { name: 'defaultZoom:number', default: 7 },
    ],
    () => new LocationPickerQuestion(''),
    'question',
);

const locale = getLocaleStrings('en');
locale.qt[SurveyJS.LOCATION_PICKER_TYPE] = 'Location Picker';
locale.pe.defaultLat = 'Latitude coordinate';
locale.pe.defaultLng = 'Longitude coordinate';
locale.pe.defaultZoom = 'Map zoom level';

// Make Creator able to instantiate it
QuestionFactory.Instance.registerQuestion(SurveyJS.LOCATION_PICKER_TYPE, (name) => {
    return new LocationPickerQuestion(name);
});
