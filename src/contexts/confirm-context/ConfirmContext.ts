import { createContext } from 'react';

import type { ConfirmContextProps } from './ConfirmContextProps';

export const ConfirmContext = createContext<ConfirmContextProps | undefined>(undefined);
