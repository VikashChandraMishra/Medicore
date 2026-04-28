import { toast } from "sonner";

type ToastOptions = {
    description?: string;
    duration?: number;
}

export const notify = {
    success: (message: string, options?: ToastOptions) => {
        toast.success(message, {
            description: options?.description,
            duration: options?.duration ?? 3000,
        });
    },

    error: (message: string, options?: ToastOptions) => {
        toast.error(message, {
            description: options?.description,
            duration: options?.duration ?? 4000,
        });
    },

    info: (message: string, options?: ToastOptions) => {
        toast(message, {
            description: options?.description,
            duration: options?.duration ?? 3000,
        });
    },

    loading: (message: string) => {
        return toast.loading(message);
    },

    dismiss: (id?: string | number) => {
        toast.dismiss(id);
    },
};
