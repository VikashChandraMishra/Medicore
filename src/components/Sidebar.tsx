import {
    BarChart3,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    Stethoscope,
    UserRound,
    UsersRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { THEME } from "../constants/theme";
import useAuth from "../hooks/use-auth";
import useData from "../hooks/use-data";
import { authService } from "../services/auth-service";
import { getInitialsFromName } from "../utils/initials";
import { getDoctorByEmail, getStaffByEmail } from "../utils/patient-scope";
import { notify } from "../utils/toast";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

function getDisplayName(email?: string | null, displayName?: string | null) {
    return displayName || email?.split("@")[0] || "User";
}

export default function Sidebar({ isOpen, onClose }: Props) {
    const { user } = useAuth();
    const { admins, doctors, staff } = useData();
    const navigate = useNavigate();
    const isAdmin = admins.some((admin) => admin.email === user?.email);
    const doctor = getDoctorByEmail(user?.email, doctors);
    const staffMember = getStaffByEmail(user?.email, staff);
    const RoleIcon = doctor ? Stethoscope : isAdmin ? ShieldCheck : UserRound;
    const displayName = getDisplayName(user?.email, user?.displayName);
    const initials = getInitialsFromName(displayName);
    const roleLabel = isAdmin ? "Admin" : doctor ? "Doctor" : staffMember ? "Staff" : "Clinic user";
    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/patients", label: "Patient Records", icon: UsersRound },
        ...(isAdmin ? [{ to: "/analytics", label: "Reports & Analytics", icon: BarChart3 }] : []),
    ];

    const handleLogout = async () => {
        try {
            await authService.logout();
            notify.success("Logged out");
            navigate("/auth/login", { replace: true });
        } catch (error) {
            notify.error(authService.getAuthErrorMessage(error));
        }
    };

    return (
        <aside
            className={`z-50 flex h-full shrink-0 flex-col ${THEME.SITE_BACKGROUND} transition-all duration-300 ease-in-out ${isOpen ? "fixed inset-y-0 left-0 w-[min(18rem,calc(100vw-2rem))] px-4 py-5 shadow-2xl md:relative md:w-72 md:shadow-none" : "hidden w-20 px-3 py-5 md:relative md:flex"}`}
        >
            <div className={`mb-6 flex items-center ${isOpen ? "justify-between" : "justify-center"}`}>
                <div className={`flex min-w-0 items-center gap-3 ${isOpen ? "" : "justify-center"}`}>
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="Medicore"
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-950">Medicore</p>
                            <p className="truncate text-xs text-gray-500">Clinic workspace</p>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className={`grid h-9 w-9 cursor-pointer place-items-center rounded-md bg-white text-gray-600 shadow-sm transition hover:text-[#0b1f4d] active:scale-[0.96] ${isOpen ? "" : "absolute -right-5 top-6 hidden md:grid"}`}
                    aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 text-sm">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            title={isOpen ? undefined : item.label}
                            className={({ isActive }) =>
                                [
                                    "flex h-11 cursor-pointer items-center rounded-full font-medium transition active:scale-[0.98]",
                                    isOpen ? "gap-3 px-3" : "justify-center px-0",
                                    isActive
                                        ? "bg-[#0b1f4d] text-white shadow-sm"
                                        : "text-gray-700 hover:bg-white hover:text-[#0b1f4d]",
                                ].join(" ")
                            }
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {isOpen && <span className="truncate">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="border-t border-gray-200 pt-4">
                <div className={`mb-3 rounded-xl bg-white shadow-sm ${isOpen ? "p-3" : "grid place-items-center p-2"}`}>
                    <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b1f4d] text-sm font-semibold text-white">
                            {initials}
                        </div>
                        {isOpen && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400">
                                    <RoleIcon className="h-3 w-3" />
                                    {roleLabel}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    title={isOpen ? undefined : "Logout"}
                    className={`flex h-10 w-full cursor-pointer items-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-red-600 hover:text-white active:scale-[0.98] ${isOpen ? "gap-3 px-3" : "justify-center px-0"}`}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {isOpen && <span>Logout</span>}
                </button>

                {isOpen && (
                    <p className="mt-4 flex items-center gap-2 px-3 text-xs text-gray-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Appointment-ready workspace
                    </p>
                )}
            </div>
        </aside>
    );
}
