import {
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { auth } from "../config/firebase-config";

const googleProvider = new GoogleAuthProvider();

export type AuthErrorDetails = {
    title: string;
    message: string;
    actionLabel: string;
    variant: "error" | "warning";
};

const ensureSessionPersistence = async () => {
    await setPersistence(auth, browserLocalPersistence);
};

const loginWithGoogle = async () => {
    await ensureSessionPersistence();
    return signInWithPopup(auth, googleProvider);
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

    if (code === "auth/popup-closed-by-user") {
        return {
            title: "Google sign-in was closed",
            message: "The sign-in window was closed before Google could finish authenticating you.",
            actionLabel: "Try again",
            variant: "warning",
        };
    }

    if (code === "auth/popup-blocked") {
        return {
            title: "Popup blocked",
            message: "Your browser blocked the Google sign-in window. Allow popups for this site and try again.",
            actionLabel: "Close",
            variant: "warning",
        };
    }

    if (code === "auth/cancelled-popup-request") {
        return {
            title: "Sign-in already in progress",
            message: "Another Google sign-in request is already open. Finish or close it before trying again.",
            actionLabel: "Close",
            variant: "warning",
        };
    }

    if (code === "auth/account-exists-with-different-credential") {
        return {
            title: "Use your original sign-in method",
            message: "This email is linked to another sign-in method. Log in using the original provider.",
            actionLabel: "Close",
            variant: "warning",
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
    loginWithGoogle,
    logout,
    getAuthErrorCode,
    getAuthErrorDetails,
    getAuthErrorMessage,
};
