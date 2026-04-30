import {
    browserLocalPersistence,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "../config/firebase-config";

export type AuthErrorDetails = {
    title: string;
    message: string;
    actionLabel: string;
    variant: "error" | "warning";
};

const ensureSessionPersistence = async () => {
    await setPersistence(auth, browserLocalPersistence);
};

const loginWithEmail = async (email: string, password: string) => {
    await ensureSessionPersistence();
    return signInWithEmailAndPassword(auth, email, password);
};

const logout = async () => {
    await signOut(auth);
};

const getAuthErrorCode = (error: unknown) => {
    return typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";
};

const getAuthErrorMessage = (error: unknown) => {
    return getAuthErrorDetails(error).message;
};

const getAuthErrorDetails = (error: unknown): AuthErrorDetails => {
    const code = getAuthErrorCode(error);

    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        return {
            title: "Login details do not match",
            message: "The email or password you entered is incorrect. Check your details and try again.",
            actionLabel: "Try again",
            variant: "warning",
        };
    }

    if (code === "auth/user-not-found") {
        return {
            title: "Account not found",
            message: "No MediCore account exists for this email. Check the email and try again.",
            actionLabel: "Got it",
            variant: "warning",
        };
    }

    if (code === "auth/invalid-email") {
        return {
            title: "Invalid email address",
            message: "The email address format is not valid. Check it and try again.",
            actionLabel: "Edit email",
            variant: "warning",
        };
    }

    if (code === "auth/user-disabled") {
        return {
            title: "Account disabled",
            message: "This account has been disabled. Contact your clinic administrator for access.",
            actionLabel: "Close",
            variant: "error",
        };
    }

    if (code === "auth/operation-not-allowed") {
        return {
            title: "Sign-in method unavailable",
            message: "This sign-in method is not enabled for the project. Contact the administrator.",
            actionLabel: "Close",
            variant: "error",
        };
    }

    if (code === "auth/network-request-failed" || code === "unavailable" || code === "deadline-exceeded") {
        return {
            title: "Connection issue",
            message: "MediCore could not reach Firebase. Check your connection and try again.",
            actionLabel: "Try again",
            variant: "error",
        };
    }

    if (code === "auth/too-many-requests" || code === "resource-exhausted") {
        return {
            title: "Too many attempts",
            message: "Access is temporarily limited because of repeated requests. Please wait and try again later.",
            actionLabel: "Close",
            variant: "warning",
        };
    }

    if (code === "permission-denied") {
        return {
            title: "Permission denied",
            message: "Your account does not have permission to complete this action. Contact an administrator.",
            actionLabel: "Close",
            variant: "error",
        };
    }

    return {
        title: "Something went wrong",
        message: "We could not complete this request. Please try again later.",
        actionLabel: "Close",
        variant: "error",
    };
};

export const authService = {
    loginWithEmail,
    logout,
    getAuthErrorCode,
    getAuthErrorDetails,
    getAuthErrorMessage,
};
