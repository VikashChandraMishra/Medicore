import { ERROR_CODES } from "../constants/response";

export type AppErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export type AppError = {
    code: AppErrorCode;
    message: string;
    details?: unknown;
}

export type AppResponse<T = unknown> =
    | {
        success: true;
        data: T;
        message?: string;
    }
    | {
        success: false;
        error: AppError;
        message?: string;
    }
