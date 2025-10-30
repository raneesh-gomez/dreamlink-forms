import { useEffect, useRef } from 'react';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { SurveyModel } from 'survey-core';
import { ReactQuestionFactory } from 'survey-react-ui';

import { SurveyJS } from '@/constants';

import { LocationPickerQuestion } from './LocationPickerQuestion';

type QuestionReactProps = { question: LocationPickerQuestion };

function LocationPickerImpl(props: QuestionReactProps) {
    const { question } = props;
    const mapEl = useRef<HTMLDivElement>(null);
    const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

    useEffect(() => {
        let disposed = false;

        (async () => {
            setOptions({
                key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
                v: 'weekly',
            });
            await importLibrary('maps');
            await importLibrary('marker');
            if (disposed) return;

            const start =
                question.value && typeof question.value === 'object'
                    ? question.value
                    : { lat: question.defaultLat ?? 6.9271, lng: question.defaultLng ?? 79.8612 };

            const map = new google.maps.Map(
                mapEl.current as HTMLDivElement,
                {
                    center: start,
                    zoom: Number(question.defaultZoom) || 7,
                    disableDefaultUI: false,
                    gestureHandling: 'greedy',
                } as google.maps.MapOptions,
            );

            const marker = new google.maps.Marker({
                map,
                position: start,
                draggable: false,
            });

            // Set value on map click
            clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (question.isReadOnly || !e.latLng) return;
                const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                marker.setPosition(pos);
                question.value = pos;
            });

            // ✅ Access SurveyModel events by casting
            const survey = question.survey as unknown as SurveyModel | undefined;

            // ✅ Type the handler so `options.question` is known
            const onVal = (_sender: SurveyModel, options: any) => {
                // options.question is the Question that changed
                if (options?.question !== question) return;

                // options.value is the new value for that question
                const newVal = options?.value;
                if (newVal && typeof newVal === 'object') {
                    const pos = newVal as { lat: number; lng: number };
                    marker.setPosition(pos);
                    map.panTo(pos);
                }
            };

            survey?.onValueChanged.add(onVal);

            // cleanup for the event subscription
            return () => {
                survey?.onValueChanged.remove(onVal);
            };
        })();

        return () => {
            disposed = true;
            try {
                clickListenerRef.current?.remove();
            } catch {}
        };
    }, [question]);

    return (
        <div
            ref={mapEl}
            style={{
                width: '100%',
                height: 320,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
            }}
        />
    );
}

// Register the React renderer
ReactQuestionFactory.Instance.registerQuestion(SurveyJS.LOCATION_PICKER_TYPE, (props: unknown) => {
    return <LocationPickerImpl {...(props as QuestionReactProps)} />;
});

export default LocationPickerImpl;
