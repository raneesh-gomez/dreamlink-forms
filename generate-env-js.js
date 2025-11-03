#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Reads VITE_... env vars at build time and writes public/env.js
const outPath = resolve(__dirname, 'public', 'env.js');

const env = {
    VITE_FRAPPE_URL: process.env.VITE_FRAPPE_URL || '',
    VITE_FRAPPE_TOKEN: process.env.VITE_FRAPPE_TOKEN || '',
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
};

const content = `window._env_ = ${JSON.stringify(env, null, 4)};\n`;

try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, { encoding: 'utf8' });
    console.log(`Wrote runtime env to ${outPath}`);
} catch (err) {
    console.error('Failed to write env file', err);
    process.exit(1);
}
