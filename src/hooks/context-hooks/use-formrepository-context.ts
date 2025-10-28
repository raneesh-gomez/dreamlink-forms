import { useContext } from 'react';

import { FormRepositoryContext } from '@/contexts/form-repository-context/FormRepositoryContext';

export const useFormRepositoryContext = () => {
    const context = useContext(FormRepositoryContext);
    if (!context) throw new Error('useFormRepositoryContext must be used within a AppProvider');
    return context;
};
