import { StrictMode } from 'react';

import { FrappeProvider } from 'frappe-react-sdk';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { ConfirmDialogProvider } from './contexts/confirm-context/ConfirmProvider';
import { FormRepositoryProvider } from './contexts/form-repository-context/FormRepositoryProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <FrappeProvider
            url="http://dreamlink.localhost:8000"
            tokenParams={{
                useToken: true,
                type: 'token',
                token: () => '4792bb735b72011:1d55759af747067',
            }}
        >
            <FormRepositoryProvider>
                <ConfirmDialogProvider>
                    <App />
                </ConfirmDialogProvider>
            </FormRepositoryProvider>
        </FrappeProvider>
    </StrictMode>,
);
