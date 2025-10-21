import { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Blocks SPA navigations done via <Link> / <a> clicks and warns on tab refresh/close.
 * For programmatic navigations (navigate("/path")), call your confirm flow before navigate().
 */
export function useBlocker(
    when: boolean,
    onAttemptNavigate: (nextPath: string) => Promise<boolean> | boolean,
) {
    const location = useLocation();
    const navigate = useNavigate();

    // 1) Block browser refresh/close with native prompt
    useEffect(() => {
        if (!when) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            // Most browsers ignore custom text and show a standard message
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [when]);

    // 2) Intercept in-app <a> / <Link> clicks
    useEffect(() => {
        if (!when) return;

        const handleClick = async (event: MouseEvent) => {
            // Only left-click without modifier keys should be blocked
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const target = event.target as HTMLElement | null;
            if (!target) return;

            const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;

            // Ignore same-page hash links, external links, and targets that open a new tab/window
            const href = anchor.getAttribute('href') || '';
            const targetAttr = anchor.getAttribute('target');
            const rel = (anchor.getAttribute('rel') || '').toLowerCase();

            const isExternal =
                /^([a-z][a-z0-9+\-.]*:)?\/\//i.test(href) ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:');
            const opensNewTab =
                targetAttr === '_blank' || rel.includes('noopener') || rel.includes('noreferrer');

            if (!href || href.startsWith('#') || isExternal || opensNewTab) return;

            // Skip if it’s the same route
            if (
                href === location.pathname + location.search + location.hash ||
                href === location.pathname
            )
                return;

            // At this point it's an internal navigation; block and ask
            event.preventDefault();
            const allow = await onAttemptNavigate(href);
            if (allow) navigate(href);
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [when, onAttemptNavigate, navigate, location.pathname, location.search, location.hash]);

    useEffect(() => {
        if (!when) return;

        const handlePopState = async () => {
            const allow = await onAttemptNavigate('POP');
            if (!allow) {
                // Try to reverse the back navigation
                history.forward();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [when, onAttemptNavigate]);
}
