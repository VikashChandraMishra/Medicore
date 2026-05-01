import { Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import AuthErrorModal from "../../components/auth/AuthErrorModal";
import Input from "../../components/ui/UiInput";
import { THEME } from "../../constants/theme";
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
    const { user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? "/dashboard";

    if (!loading && user) {
        return <Navigate to={redirectTo} replace />;
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
        setIsSubmitting(true);

        try {
            await authService.loginWithEmail(email.trim(), password);
            notify.success("Login successful");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setAuthError(authService.getAuthErrorDetails(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`flex h-full items-center justify-center ${THEME.SITE_BACKGROUND} px-6`}>
            <div className="w-full max-w-md rounded-lg bg-white p-8">
                <h1 className="mb-2 text-center text-3xl font-semibold text-gray-950">
                    Welcome back
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Sign in with your MediCore account.
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
                        disabled={isSubmitting}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        leftIcon={<Lock className="h-4 w-4" />}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 font-medium text-white transition hover:bg-[#102a63] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Login
                    </button>
                </form>
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
