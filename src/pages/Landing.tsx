import { THEME } from "../constants/theme";

export default function Landing() {
    return (
        <div className={`min-h-screen ${THEME.SITE_BACKGROUND} text-gray-800`}>
            {/* Hero */}
            <section className="mt-12 px-4 text-center sm:mt-16 sm:px-6">
                <h1 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                    Modern Healthcare Management Platform
                </h1>

                <p className="max-w-2xl mx-auto text-gray-500 mb-8">
                    Manage patients, appointments, and analytics - all in one clean,
                    scalable interface designed for clinics and hospitals.
                </p>

                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                    <button className="cursor-pointer rounded-md bg-[#0b1f4d] px-6 py-3 text-white transition hover:bg-[#102a63] active:scale-[0.98]">
                        Get Started
                    </button>
                    <button className="cursor-pointer rounded-md bg-gray-200 px-6 py-3 text-gray-800 transition hover:bg-gray-300 active:scale-[0.98]">
                        View Demo
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3 md:gap-6">
                <div className="p-6 bg-white rounded-xl">
                    <h3 className="font-semibold text-lg mb-2">Patient Management</h3>
                    <p className="text-sm text-gray-500">
                        Organize and access patient records with ease.
                    </p>
                </div>

                <div className="p-6 bg-white rounded-xl">
                    <h3 className="font-semibold text-lg mb-2">Analytics Dashboard</h3>
                    <p className="text-sm text-gray-500">
                        Track key metrics and gain actionable insights.
                    </p>
                </div>

                <div className="p-6 bg-white rounded-xl">
                    <h3 className="font-semibold text-lg mb-2">Smart Scheduling</h3>
                    <p className="text-sm text-gray-500">
                        Manage appointments and availability efficiently.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-sm text-gray-500 mt-20 pb-6">
                2026 Medicore. Built for modern healthcare teams.
            </footer>
        </div>
    );
}
