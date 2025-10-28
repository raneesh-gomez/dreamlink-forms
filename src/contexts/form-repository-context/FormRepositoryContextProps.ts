import type { FormHooksRepository, PersistMode } from '@/types/persistence.types';

export type FormRepositoryContextProps = {
    mode: PersistMode;
    setMode: (m: PersistMode) => void;
    repo: FormHooksRepository;
};
