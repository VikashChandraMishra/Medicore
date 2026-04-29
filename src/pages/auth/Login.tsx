import { CircleUserRound, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import AuthErrorModal from "../../components/auth/AuthErrorModal";
import Input from "../../components/ui/Input";
import useAuth from "../../hooks/use-auth";
import { authService, type AuthErrorDetails } from "../../services/auth-service";
import { notify } from "../../utils/toast";

type LocationState = {
    from?: {
        pathname?: string;
    };
};

function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
}

export default function Login() {
    const { user, loading, isVerified } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);
    const [submitting, setSubmitting] = useState<"email" | "google" | null>(null);
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? "/dashboard";

    if (!loading && user && isVerified) {
        return <Navigate to={redirectTo} replace />;
    }

    if (!loading && user && !isVerified) {
        return <Navigate to="/auth/verify-email" replace />;
    }

    const validateForm = () => {
        if (!email.trim() || !password) return "Email and password are required.";
        if (!isValidEmail(email)) return "Enter a valid email address.";
        if (password.length < 6) return "Password must be at least 6 characters.";

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
            const credential = await authService.loginWithEmail(email.trim(), password);

            if (!credential.user.emailVerified) {
                navigate("/auth/verify-email", { replace: true });
                return;
            }

            notify.success("Login successful");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setSubmitting(null);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setSubmitting("google");

        try {
            await authService.loginWithGoogle();
            notify.success("Google login successful");
            navigate(redirectTo, { replace: true });
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
                    Welcome back
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Sign in to continue to MediCore.
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

                    <button
                        type="submit"
                        disabled={Boolean(submitting)}
                        className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 font-medium text-white transition hover:bg-[#102a63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Login
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
                    Don't have an account?{" "}
                    <Link
                        to="/auth/signup"
                        className="cursor-pointer font-medium text-[#0b1f4d] hover:underline active:translate-y-px"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>

            {authError && (
                <AuthErrorModal
                    error={authError}
                    onClose={() => setAuthError(null)}
                />
            )}
        </div>
    );
}
