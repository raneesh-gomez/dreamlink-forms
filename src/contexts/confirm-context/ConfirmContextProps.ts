export type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
};

export type ConfirmContextProps = {
    confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};
