import {
    GoogleAuthProvider,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    deleteUser,
    getAdditionalUserInfo,
    sendEmailVerification,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { DEPARTMENTS, USER_ROLES, USER_STATUS } from "../constants/user";
import { auth, db } from "../config/firebase-config";

const googleProvider = new GoogleAuthProvider();
const USER_DOCUMENT_CREATE_FAILED = "app/user-document-create-failed";

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

const getFallbackDisplayName = (user: FirebaseUser) => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];

    return "MediCore User";
};

const createUserDocument = async (user: FirebaseUser) => {
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const existingUser = await getDoc(userRef);

    if (existingUser.exists()) {
        await setDoc(
            userRef,
            {
                lastLoginAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );
        return;
    }

    await setDoc(userRef, {
        uid: user.uid,
        displayName: getFallbackDisplayName(user),
        email: user.email ?? "",
        phone: user.phoneNumber ?? "",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
        department: DEPARTMENTS.FRONT_DESK,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
    });
};

const loginWithGoogle = async () => {
    await ensureSessionPersistence();
    const credential = await signInWithPopup(auth, googleProvider);
    const userInfo = getAdditionalUserInfo(credential);

    try {
        await createUserDocument(credential.user);
    } catch (error) {
        if (userInfo?.isNewUser) {
            await deleteUser(credential.user);
        }

        throw Object.assign(new Error("Unable to create user profile."), {
            code: USER_DOCUMENT_CREATE_FAILED,
            cause: error,
        });
    }

    return credential;
};

const signUpWithEmail = async (email: string, password: string) => {
    await ensureSessionPersistence();
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    try {
        await createUserDocument(credential.user);
    } catch (error) {
        await deleteUser(credential.user);

        throw Object.assign(new Error("Unable to create user profile."), {
            code: USER_DOCUMENT_CREATE_FAILED,
            cause: error,
        });
    }

    await sendEmailVerification(credential.user);

    return credential;
};

const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
        throw new Error("No authenticated user found.");
    }

    await sendEmailVerification(auth.currentUser);
};

const refreshCurrentUser = async () => {
    if (!auth.currentUser) {
        return null;
    }

    await auth.currentUser.reload();

    return auth.currentUser;
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
            message: "No MediCore account exists for this email. Create an account or try another email.",
            actionLabel: "Got it",
            variant: "warning",
        };
    }

    if (code === "auth/email-already-in-use") {
        return {
            title: "Account already exists",
            message: "A MediCore account already exists for this email. Use login to continue.",
            actionLabel: "Got it",
            variant: "warning",
        };
    }

    if (code === "auth/weak-password") {
        return {
            title: "Password is too weak",
            message: "Use a password with at least 6 characters before creating the account.",
            actionLabel: "Update password",
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

    if (code === USER_DOCUMENT_CREATE_FAILED) {
        return {
            title: "Account setup failed",
            message: "Your authentication account was rolled back because your user profile could not be created. Please try again later.",
            actionLabel: "Try again later",
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
    loginWithGoogle,
    signUpWithEmail,
    createUserDocument,
    USER_DOCUMENT_CREATE_FAILED,
    resendVerificationEmail,
    refreshCurrentUser,
    logout,
    getAuthErrorCode,
    getAuthErrorDetails,
    getAuthErrorMessage,
};
