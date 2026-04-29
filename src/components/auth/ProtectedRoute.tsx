import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import useAuth from "../../hooks/use-auth";

export default function ProtectedRoute() {
    const { user, loading, isVerified } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="grid min-h-80 place-items-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (!isVerified) {
        return <Navigate to="/auth/verify-email" replace />;
    }

    return <Outlet />;
}
