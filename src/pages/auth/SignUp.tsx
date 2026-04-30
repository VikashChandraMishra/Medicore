import { CircleUserRound, Loader2, Lock, Mail, UserRoundCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthErrorModal from "../../components/auth/AuthErrorModal";
import Input from "../../components/ui/Input";
import useAuth from "../../hooks/use-auth";
import { authService, type AuthErrorDetails } from "../../services/auth-service";
import { notify } from "../../utils/toast";

function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
}

export default function SignUp() {
    const { user, loading, isVerified } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [existingEmail, setExistingEmail] = useState("");
    const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);
    const [submitting, setSubmitting] = useState<"email" | "google" | null>(null);

    if (!loading && user && isVerified) {
        return <Navigate to="/dashboard" replace />;
    }

    if (!loading && user && !isVerified) {
        return <Navigate to="/auth/verify-email" replace />;
    }

    const validateForm = () => {
        if (!email.trim() || !password || !confirmPassword) {
            return "Email, password, and confirmation are required.";
        }

        if (!isValidEmail(email)) return "Enter a valid email address.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        if (password !== confirmPassword) return "Passwords do not match.";

        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setSubmitting("email");

        try {
            await authService.signUpWithEmail(email.trim(), password);
            notify.success("Verification email sent", {
                description: "Check your inbox before continuing.",
            });
            navigate("/auth/verify-email", { replace: true });
        } catch (err) {
            if (authService.getAuthErrorCode(err) === "auth/email-already-in-use") {
                setExistingEmail(email.trim());
                return;
            }

            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setSubmitting(null);
        }
    };

    const closeExistingAccountModal = () => {
        setExistingEmail("");
    };

    const clearEmailAndCloseModal = () => {
        setExistingEmail("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleGoogleLogin = async () => {
        setError("");
        setSubmitting("google");

        try {
            await authService.loginWithGoogle();
            notify.success("Google account connected");
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="mb-2 text-center text-3xl font-semibold text-gray-950">
                    Create your account
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Email accounts require verification before app access.
                </p>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        leftIcon={<Mail className="h-4 w-4" />}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={Boolean(submitting)}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        leftIcon={<Lock className="h-4 w-4" />}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={Boolean(submitting)}
                    />

                    <Input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        leftIcon={<Lock className="h-4 w-4" />}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={Boolean(submitting)}
                    />

                    <button
                        type="submit"
                        disabled={Boolean(submitting)}
                        className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 font-medium text-white transition hover:bg-[#102a63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Sign Up
                    </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
                    <span className="h-px flex-1 bg-gray-200" />
                    OR
                    <span className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={Boolean(submitting)}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting === "google" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CircleUserRound className="h-4 w-4" />
                    )}
                    Continue with Google
                </button>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link
                        to="/auth/login"
                        className="cursor-pointer font-medium text-[#0b1f4d] hover:underline active:translate-y-px"
                    >
                        Login
                    </Link>
                </p>
            </div>

            {existingEmail && (
                <div
                    className="fixed inset-0 z-80 grid place-items-center bg-gray-950/45 px-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="existing-account-title"
                >
                    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0b1f4d]/8 text-[#0b1f4d]">
                                    <UserRoundCheck className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2
                                        id="existing-account-title"
                                        className="text-xl font-semibold text-gray-950"
                                    >
                                        Account already exists
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        This email is already registered.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeExistingAccountModal}
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-[0.95]"
                                aria-label="Close existing account dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            <span className="font-medium text-gray-950">{existingEmail}</span>{" "}
                            already has a MediCore account. Use login to continue, or try a
                            different email address.
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <Link
                                to="/auth/login"
                                state={{ email: existingEmail }}
                                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-[#0b1f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                            >
                                Go to Login
                            </Link>
                            <button
                                type="button"
                                onClick={clearEmailAndCloseModal}
                                className="cursor-pointer rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98]"
                            >
                                Use another email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {authError && (
                <AuthErrorModal
                    error={authError}
                    onClose={() => setAuthError(null)}
                />
            )}
        </div>
    );
}
