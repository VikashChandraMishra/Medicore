export default function Landing() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Hero */}
            <section className="text-center px-6 mt-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Modern Healthcare Management Platform
                </h1>

                <p className="max-w-2xl mx-auto text-gray-600 mb-8">
                    Manage patients, appointments, and analytics — all in one clean,
                    scalable interface designed for clinics and hospitals.
                </p>

                <div className="flex justify-center gap-4">
                    <button className="px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                        Get Started
                    </button>
                    <button className="px-6 py-3 rounded-md bg-gray-200 hover:bg-gray-300">
                        View Demo
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-6 mt-20 grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border">
                    <h3 className="font-semibold text-lg mb-2">Patient Management</h3>
                    <p className="text-sm text-gray-600">
                        Organize and access patient records with ease.
                    </p>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border">
                    <h3 className="font-semibold text-lg mb-2">Analytics Dashboard</h3>
                    <p className="text-sm text-gray-600">
                        Track key metrics and gain actionable insights.
                    </p>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border">
                    <h3 className="font-semibold text-lg mb-2">Smart Scheduling</h3>
                    <p className="text-sm text-gray-600">
                        Manage appointments and availability efficiently.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-sm text-gray-500 mt-20 pb-6">
                © 2026 Medicore. Built for modern healthcare teams.
            </footer>
        </div>
    );
}
