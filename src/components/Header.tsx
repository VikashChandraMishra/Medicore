import { Link } from "react-router";

export default function Header() {
    return (
        <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
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
                <Link to="#" className="hover:text-blue-600">
                    Features
                </Link>
                <Link to="#" className="hover:text-blue-600">
                    Analytics
                </Link>
                <Link to="/patients" className="hover:text-blue-600">
                    Patients
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        to="/auth/login"
                        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                    >
                        Login
                    </Link>

                    <Link
                        to="/auth/signup"
                        className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700"
                    >
                        Sign Up
                    </Link>
                </div>
            </nav>
        </header>
    );
}
