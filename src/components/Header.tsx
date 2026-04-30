import { LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../hooks/use-auth";
import { authService } from "../services/auth-service";
import { notify } from "../utils/toast";

function getDisplayName(email?: string | null, displayName?: string | null) {
    return displayName || email?.split("@")[0] || "User";
}

function getInitials(name: string) {
    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const displayName = getDisplayName(user?.email, user?.displayName);
    const initials = getInitials(displayName);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            setIsMenuOpen(false);
            notify.success("Logged out");
            navigate("/auth/login", { replace: true });
        } catch (error) {
            notify.error(authService.getAuthErrorMessage(error));
        }
    };

    return (
        <header className="relative z-60 shrink-0 border-b border-gray-200 bg-gray-50/95 backdrop-blur">
            <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
                {/* Left: Logo + Name */}
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="Medicore Logo"
                        className="w-8 h-8 object-contain"
                    />
                    <h2 className="text-xl font-semibold">Medicore</h2>
                </div>

                {/* Right: Navigation */}
                <nav className="flex items-center gap-6 text-sm">
                    <Link to="#" className="cursor-pointer text-gray-700 transition-colors hover:text-[#0b1f4d] active:translate-y-px">
                        Features
                    </Link>
                    <Link to="#" className="cursor-pointer text-gray-700 transition-colors hover:text-[#0b1f4d] active:translate-y-px">
                        Analytics
                    </Link>
                    <Link to="/patients" className="cursor-pointer text-gray-700 transition-colors hover:text-[#0b1f4d] active:translate-y-px">
                        Patients
                    </Link>

                    {user ? (
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-[#0b1f4d] text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.96]"
                                aria-label="Open account menu"
                                aria-expanded={isMenuOpen}
                            >
                                {initials}
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-12 z-70 w-72 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-white">
                                    <div className="px-4 py-3">
                                        <p className="truncate text-base font-semibold">
                                            {displayName}
                                        </p>
                                        <p className="truncate text-sm text-slate-300">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Link
                                        to="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 border-t border-slate-800 px-4 py-4 text-sm font-medium text-slate-100 transition hover:bg-white hover:text-[#0b1f4d] active:translate-y-px"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        Dashboard
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full cursor-pointer items-center gap-3 border-t border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-100 transition hover:bg-red-600 hover:text-white active:translate-y-px"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/auth/login"
                            className="cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-2 text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
