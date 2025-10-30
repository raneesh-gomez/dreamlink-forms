// src/components/surveyjs/location-picker/locationPicker.icon.ts
import { SvgRegistry } from 'survey-core';

const LOCATION_PIN_SVG = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="var(--sjs-primary-background-500)"
     xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
</svg>
`;

// The name you register here becomes the class you use: "icon-location-picker"
SvgRegistry.registerIconFromSvg('icon-location-picker', LOCATION_PIN_SVG);
