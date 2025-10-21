import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { ConfirmContext } from './ConfirmContext';
import type { ConfirmOptions } from './ConfirmContextProps';

type Resolver = (value: boolean) => void;

/**
 * Global provider that renders a single dialog and exposes a promise-based confirm API.
 */
export function ConfirmDialogProvider({ children }: PropsWithChildren) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: 'Are you sure?',
        description: 'Please confirm your action.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'default',
    });
    const [resolver, setResolver] = useState<Resolver | null>(null);

    const confirm = useCallback((opts?: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions((prev: ConfirmOptions) => ({ ...prev, ...(opts || {}) }));
            setResolver(() => resolve);
            setOpen(true);
        });
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const handleCancel = useCallback(() => {
        resolver?.(false);
        setResolver(null);
        handleClose();
    }, [resolver, handleClose]);

    const handleConfirm = useCallback(() => {
        resolver?.(true);
        setResolver(null);
        handleClose();
    }, [resolver, handleClose]);

    const value = useMemo(() => ({ confirm }), [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        {options.description ? (
                            <DialogDescription>{options.description}</DialogDescription>
                        ) : null}
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                            {options.cancelText || 'Cancel'}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className={
                                options.variant === 'destructive'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : undefined
                            }
                        >
                            {options.confirmText || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}
