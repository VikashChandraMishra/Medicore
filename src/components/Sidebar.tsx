import { Link } from "react-router";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: Props) {
    return (
        <aside
            className={`
                bg-white border-r h-[calc(100vh-64px)]
                transition-all duration-300 ease-in-out
                ${isOpen ? "w-64 p-4" : "w-0 p-0 overflow-hidden"}
            `}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold whitespace-nowrap">Menu</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-800"
                >
                    ✕
                </button>
            </div>

            <nav className="flex flex-col gap-3 text-sm">
                <Link to="/dashboard" className="hover:text-blue-600">
                    Dashboard
                </Link>
                <Link to="/patients" className="hover:text-blue-600">
                    Patients
                </Link>
                <Link to="/analytics" className="hover:text-blue-600">
                    Analytics
                </Link>
            </nav>
        </aside>
    );
}
