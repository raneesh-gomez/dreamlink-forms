import { StrictMode } from 'react';

import { FrappeProvider } from 'frappe-react-sdk';
import { createRoot } from 'react-dom/client';

import env from '@/config/env';

import App from './App.tsx';
import { ConfirmDialogProvider } from './contexts/confirm-context/ConfirmProvider';
import { FormRepositoryProvider } from './contexts/form-repository-context/FormRepositoryProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <FrappeProvider
            url={env.frappeUrl}
            tokenParams={{
                useToken: true,
                type: 'token',
                token: () => env.frappeToken,
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
