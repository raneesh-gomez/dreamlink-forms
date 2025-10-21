import { useContext } from 'react';

import { ConfirmContext } from '@/contexts/confirm-context/ConfirmContext';

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within a ConfirmDialogProvider');
    }
    return ctx.confirm;
}
