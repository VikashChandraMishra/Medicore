import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { THEME } from "./constants/theme";
import useAuth from "./hooks/use-auth";

export default function AppLayout() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
        typeof window === "undefined" ? true : window.innerWidth >= 768,
    );
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

    useEffect(() => {
        if (!shouldShowSidebar) return;

        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [shouldShowSidebar]);

    return (
        <div className={`h-screen overflow-hidden ${THEME.SITE_BACKGROUND} text-gray-800 flex flex-col`}>
            {!user && <Header />}

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {shouldShowSidebar && (
                    <>
                        {isSidebarOpen && (
                            <button
                                type="button"
                                className="fixed inset-0 z-40 bg-gray-950/20 md:hidden"
                                onClick={toggleSidebar}
                                aria-label="Close sidebar"
                            />
                        )}
                        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
                    </>
                )}

                <main className="relative z-0 min-w-0 flex-1 overflow-y-auto transition-all duration-300">
                    {shouldShowSidebar && !isSidebarOpen && (
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="sticky top-3 z-30 ml-3 mt-3 grid h-10 w-10 place-items-center rounded-md bg-white text-gray-700 shadow-sm md:hidden"
                            aria-label="Open sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    )}
                    <div className="mx-auto min-h-full w-full max-w-7xl p-3 pb-8 sm:p-5 lg:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
