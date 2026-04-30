import { Link } from "react-router";

export default function Header() {
    return (
        <header className="shrink-0 border-b border-gray-200 bg-gray-50/95 backdrop-blur">
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

                    <Link
                        to="/auth/login"
                        className="cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-2 text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                    >
                        Login
                    </Link>
                </nav>
            </div>
        </header>
    );
}
