import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { THEME } from "./constants/theme";
import useAuth from "./hooks/use-auth";

export default function AppLayout() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const shouldShowSidebar = Boolean(user);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!shouldShowSidebar) return;

            if (e.ctrlKey && e.key.toLowerCase() === "b") {
                e.preventDefault();
                toggleSidebar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shouldShowSidebar]);

    return (
        <div className={`h-screen overflow-hidden ${THEME.SITE_BACKGROUND} text-gray-800 flex flex-col`}>
            {!user && <Header />}

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {shouldShowSidebar && (
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
                )}

                <main className="relative z-0 min-w-0 flex-1 overflow-y-auto transition-all duration-300">
                    <div className="mx-auto min-h-full w-full max-w-7xl p-4 pb-8 sm:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
