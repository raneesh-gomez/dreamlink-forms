import { useCallback } from 'react';

import { useBlocker } from '@/hooks/use-blocker';
import { useConfirm } from '@/hooks/use-confirm';

export default function NavigationGuard({
    when,
    message = 'You have unsaved changes. Are you sure you want to leave this page?',
}: {
    when: boolean;
    message?: string;
}) {
    const confirm = useConfirm();

    const handleAttemptNavigate = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_nextPath: string) => {
            const ok = await confirm({
                title: 'Leave this page?',
                description: message,
                confirmText: 'Leave',
                cancelText: 'Stay',
                variant: 'destructive',
            });
            return ok;
        },
        [confirm, message],
    );

    useBlocker(when, handleAttemptNavigate);

    return null;
}
