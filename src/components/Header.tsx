import { Link } from "react-router";

export default function Header() {
    return (
        <header className="relative z-60 shrink-0 border-b border-gray-200 bg-gray-50/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="Medicore Logo"
                        className="h-[2.3rem] w-[2.3rem] object-contain"
                    />
                    <h2 className="text-xl font-semibold">Medicore</h2>
                </div>

                <Link
                    to="/auth/login"
                    className="cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-2 text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                >
                    Login
                </Link>
            </div>
        </header>
    );
}
