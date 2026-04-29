import { CheckCircle2, Loader2, LogOut, MailCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthErrorModal from "../../components/auth/AuthErrorModal";
import useAuth from "../../hooks/use-auth";
import { authService, type AuthErrorDetails } from "../../services/auth-service";
import { notify } from "../../utils/toast";

export default function VerifyEmail() {
    const { user, loading, isVerified } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);

    if (!loading && !user) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!loading && user && isVerified) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleCheckVerification = async () => {
        setError("");
        setChecking(true);

        try {
            const refreshedUser = await authService.refreshCurrentUser();

            if (refreshedUser?.emailVerified) {
                notify.success("Email verified");
                navigate("/dashboard", { replace: true });
                return;
            }

            setError("Email is not verified yet. Check your inbox and try again.");
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setChecking(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setResending(true);

        try {
            await authService.resendVerificationEmail();
            notify.success("Verification email sent");
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate("/auth/login", { replace: true });
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        }
    };

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-gray-50 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#0b1f4d]/8 text-[#0b1f4d]">
                    <MailCheck className="h-8 w-8" />
                </div>

                <h1 className="text-3xl font-semibold text-gray-950">
                    Verify your email
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
                    We sent a verification link to{" "}
                    <span className="font-semibold text-gray-800">{user?.email}</span>.
                    Open that email, confirm your account, then return here.
                </p>

                {error && (
                    <div className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleCheckVerification}
                        disabled={checking || resending}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 font-medium text-white transition hover:bg-[#102a63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {checking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        I verified my email
                    </button>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={checking || resending}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {resending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Resend email
                    </button>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-gray-500 sm:flex-row">
                    <Link
                        to="/"
                        className="cursor-pointer font-medium text-[#0b1f4d] hover:underline active:translate-y-px"
                    >
                        Back to landing
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex cursor-pointer items-center gap-1 font-medium text-gray-600 transition hover:text-gray-950 active:translate-y-px"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
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
