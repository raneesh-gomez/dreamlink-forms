import { useEffect, useMemo } from 'react';

import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';

import type { DocTypeRow, UserRow } from '@/types';

type UseFrappeProbeOptions = {
    /** Turn the probe on/off (useful to wait until auth is ready) */
    enabled?: boolean;
    /** Show success/error toasts */
    withToasts?: boolean;
    /** Limit rows fetched for doctypes/users */
    limit?: number;
};

export function useFrappeProbe(options: UseFrappeProbeOptions = {}) {
    const { enabled = true, withToasts = true, limit = 10 } = options;

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

    // DocTypes
    const {
        data: doctypes,
        error: doctypeErrs,
        isLoading: doctypesLoading,
    } = useFrappeGetDocList<DocTypeRow>(
        'DocType',
        {
            limit,
        },
        { enabled },
    );

    // Users (latest by creation desc)
    const {
        data: users,
        error: usersErr,
        isLoading: usersLoading,
    } = useFrappeGetDocList<UserRow>(
        'User',
        {
            fields: ['name', 'full_name', 'email', 'creation'],
            orderBy: { field: 'creation', order: 'desc' },
            limit,
        },
        { enabled },
    );

    useEffect(() => {
        if (!enabled) return;
        if (!doctypesLoading && doctypes) {
            if (withToasts) toast.success(`Fetched ${doctypes.length} new doctypes(s)`);
            console.table(doctypes);
        }
    }, [enabled, doctypesLoading, doctypes, withToasts]);

    useEffect(() => {
        if (!enabled) return;
        if (doctypeErrs && withToasts) {
            toast.error(`DocType fetch error: ${String(doctypeErrs)}`);
        }
    }, [enabled, doctypeErrs, withToasts]);

    useEffect(() => {
        if (!enabled) return;
        if (!usersLoading && users) {
            if (withToasts) toast.success(`Fetched ${users.length} new user(s) today`);
            console.table(users);
        }
    }, [enabled, usersLoading, users, withToasts]);

    useEffect(() => {
        if (!enabled) return;
        if (usersErr && withToasts) {
            toast.error(`User fetch error: ${String(usersErr)}`);
        }
    }, [enabled, usersErr, withToasts]);

    return useMemo(
        () => ({
            ping,
            pingErr,
            doctypes,
            doctypeErrs,
            doctypesLoading,
            users,
            usersErr,
            usersLoading,
        }),
        [ping, pingErr, doctypes, doctypeErrs, doctypesLoading, users, usersErr, usersLoading],
    );
}
