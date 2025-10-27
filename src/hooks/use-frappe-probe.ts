import { useEffect, useMemo } from 'react';

import { useFrappeGetCall } from 'frappe-react-sdk';
import { toast } from 'sonner';

type UseFrappeProbeOptions = {
    /** Turn the probe on/off (useful to wait until auth is ready) */
    enabled?: boolean;
    /** Show success/error toasts */
    withToasts?: boolean;
    /** Limit rows fetched for doctypes/users */
    limit?: number;
};

export function useFrappeProbe(options: UseFrappeProbeOptions = {}) {
    const { enabled = true, withToasts = true } = options;

    const { data: ping, error: pingErr } = useFrappeGetCall<{ message: string }>('ping');

    useEffect(() => {
        if (!enabled) return;
        if (ping?.message === 'pong' && withToasts) {
            toast.success('Connected to Frappe ✅');
        }
    }, [enabled, ping, withToasts]);

    useEffect(() => {
        if (!enabled) return;
        if (pingErr && withToasts) {
            toast.error(`Frappe ping error: ${String(pingErr)}`);
        }
    }, [enabled, pingErr, withToasts]);

    return useMemo(
        () => ({
            ping,
            pingErr,
        }),
        [ping, pingErr],
    );
}
