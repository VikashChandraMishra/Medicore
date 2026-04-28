import StatCard from "../components/dashboard/StatCard";
import ChartCard from "../components/dashboard/ChartCard";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <main className="max-w-7xl mx-auto px-6 mt-10">
                {/* Stat Cards */}
                <section className="grid md:grid-cols-3 gap-6">
                    <StatCard title="Total Patients" value="1,248" />
                    <StatCard title="Appointments Today" value="32" />
                    <StatCard title="Revenue" value="$12,400" />
                </section>

                {/* Charts */}
                <section className="grid md:grid-cols-2 gap-6 mt-10">
                    <ChartCard title="Patient Growth" />
                    <ChartCard title="Appointments Overview" />
                </section>
            </main>
        </div>
    );
}
