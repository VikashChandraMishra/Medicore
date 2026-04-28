import { AppResponse, AppError, AppErrorCode } from "../types/response";

export function ok<T>(data: T, message?: string): AppResponse<T> {
    return { success: true, data, message };
}

export function fail(
    code: AppErrorCode,
    message: string,
    details?: unknown
): AppResponse<never> {
    const error: AppError = { code, message, details }
    return { success: false, error, message };
}
