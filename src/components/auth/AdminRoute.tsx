import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router";
import useAuth from "../../hooks/use-auth";
import useData from "../../hooks/use-data";

export default function AdminRoute() {
    const { user } = useAuth();
    const { admins, loading } = useData();
    const isAdmin = admins.some((admin) => admin.email === user?.email);

    if (loading) {
        return (
            <div className="grid min-h-80 place-items-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
