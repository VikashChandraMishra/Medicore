import { createBrowserRouter } from "react-router";
import AppLayout from "./AppLayout";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

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
                path: "auth/signup",
                Component: SignUp,
            },
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
]);
