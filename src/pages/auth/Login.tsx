import { CircleUserRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import AuthErrorModal from "../../components/auth/AuthErrorModal";
import useAuth from "../../hooks/use-auth";
import { authService, type AuthErrorDetails } from "../../services/auth-service";
import { notify } from "../../utils/toast";

type LocationState = {
    from?: {
        pathname?: string;
    };
};

export default function Login() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? "/dashboard";

    if (!loading && user) {
        return <Navigate to={redirectTo} replace />;
    }

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);

        try {
            await authService.loginWithGoogle();
            notify.success("Google login successful");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="mb-2 text-center text-3xl font-semibold text-gray-950">
                    Welcome back
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Continue with your clinic Google account.
                </p>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 font-medium text-white transition hover:bg-[#102a63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CircleUserRound className="h-4 w-4" />
                    )}
                    Continue with Google
                </button>
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
