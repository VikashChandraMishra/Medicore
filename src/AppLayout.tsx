import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === "b") {
                e.preventDefault();
                toggleSidebar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="h-screen overflow-hidden bg-gray-50 text-gray-800 flex flex-col">
            <Header />

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

                <main className="flex-1 min-w-0 overflow-y-auto transition-all duration-300">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
