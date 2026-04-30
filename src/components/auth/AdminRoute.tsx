import { Navigate, Outlet } from "react-router";
import { isAdminEmail } from "../../data/users";
import useAuth from "../../hooks/use-auth";

export default function AdminRoute() {
    const { user } = useAuth();

    if (!isAdminEmail(user?.email)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
