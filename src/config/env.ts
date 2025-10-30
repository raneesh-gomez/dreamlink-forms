const env = {
    frappeUrl: import.meta.env.VITE_FRAPPE_URL || (window as any)._env_?.VITE_FRAPPE_URL || '',
    frappeToken:
        import.meta.env.VITE_FRAPPE_TOKEN || (window as any)._env_?.VITE_FRAPPE_TOKEN || '',
    googleMapsApiKey:
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        (window as any)._env_?.VITE_GOOGLE_MAPS_API_KEY ||
        '',
};
export default env;
