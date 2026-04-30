import { createBrowserRouter } from "react-router";
import AppLayout from "./AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: AppLayout,
        children: [
            {
                path: "/",
                Component: Landing,
            },
            {
                path: "auth/login",
                Component: Login,
            },
            {
                Component: ProtectedRoute,
                children: [
                    {
                        path: "dashboard",
                        Component: Dashboard,
                    },
                    {
                        path: "patients",
                        Component: Patients,
                    },
                    {
                        path: "analytics",
                        Component: Analytics,
                    },
                ],
            },
        ],
    },
]);
