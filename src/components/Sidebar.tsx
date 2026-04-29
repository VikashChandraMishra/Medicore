import { NavLink } from "react-router";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: Props) {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "rounded-md px-3 py-2 font-medium transition-colors",
            isActive
                ? "bg-white text-gray-950 shadow-sm ring-1 ring-gray-200"
                : "text-gray-600 hover:bg-white/70 hover:text-gray-950",
        ].join(" ");

    return (
        <aside
            className={`
                h-full shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/95 backdrop-blur
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
                <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900"
                    aria-label="Close sidebar"
                >
                    X
                </button>
            </div>

            <nav className="flex flex-col gap-1 text-sm">
                <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                </NavLink>
                <NavLink to="/patients" className={navLinkClass}>
                    Patients
                </NavLink>
                <NavLink to="/analytics" className={navLinkClass}>
                    Analytics
                </NavLink>
            </nav>
        </aside>
    );
}
