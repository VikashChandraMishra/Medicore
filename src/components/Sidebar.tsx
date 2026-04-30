import { NavLink } from "react-router";
import { isAdminEmail } from "../data/users";
import useAuth from "../hooks/use-auth";
import CloseButton from "./ui/CloseButton";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: Props) {
    const { user } = useAuth();
    const isAdmin = isAdminEmail(user?.email);
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "cursor-pointer rounded-md px-3 py-2 font-medium transition-colors active:scale-[0.98]",
            isActive
                ? "bg-white text-gray-800 ring-1 ring-gray-200"
                : "text-gray-500 hover:bg-white/70 hover:text-gray-800",
        ].join(" ");

    return (
        <aside
            className={`
                relative z-50 h-full shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/95 backdrop-blur
                transition-all duration-300 ease-in-out
                ${isOpen ? "w-64 px-4 py-5" : "w-0 p-0 overflow-hidden"}
            `}
        >
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="font-semibold whitespace-nowrap">Menu</h2>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                        Workspace
                    </p>
                </div>
                <CloseButton
                    onClick={onClose}
                    label="Close sidebar"
                    className="h-8 w-8 hover:bg-white hover:text-gray-800"
                />
            </div>

            <nav className="flex flex-col gap-1 text-sm">
                <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                </NavLink>
                <NavLink to="/patients" className={navLinkClass}>
                    Patients
                </NavLink>
                {isAdmin && (
                    <NavLink to="/analytics" className={navLinkClass}>
                        Analytics
                    </NavLink>
                )}
            </nav>
        </aside>
    );
}
