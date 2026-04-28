import { ENVIRONMENT } from "../constants/environment";

const isDev = import.meta.env.VITE_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT;

export const logger = {
    debug: (message: string, meta?: unknown) => {
        if (!isDev) return;
        console.log("[DEBUG]", message, meta);
    },

    info: (message: string, meta?: unknown) => {
        if (!isDev) return;
        console.log("[INFO]", message, meta);
    },

    warn: (message: string, meta?: unknown) => {
        if (!isDev) return;
        console.warn("[WARN]", message, meta);
    },

    error: (message: string, meta?: unknown) => {
        if (!isDev) return;
        console.error("[ERROR]", message, meta);
    },
};
