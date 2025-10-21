import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { ConfirmDialogProvider } from './contexts/confirm-context/ConfirmProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ConfirmDialogProvider>
            <App />
        </ConfirmDialogProvider>
    </StrictMode>,
);
