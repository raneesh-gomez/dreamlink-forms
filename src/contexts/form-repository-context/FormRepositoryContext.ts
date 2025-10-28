import { createContext } from 'react';

import type { FormRepositoryContextProps } from './FormRepositoryContextProps';

export const FormRepositoryContext = createContext<FormRepositoryContextProps | undefined>(
    undefined,
);
