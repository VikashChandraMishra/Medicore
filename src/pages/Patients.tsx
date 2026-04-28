import { useState } from "react";
import PatientCard from "../components/patients/PatientCard";
import PatientRow from "../components/patients/PatientRow";

type Patient = {
    id: number;
    name: string;
    age: number;
    condition: string;
};

const mockPatients: Patient[] = [
    { id: 1, name: "John Doe", age: 34, condition: "Diabetes" },
    { id: 2, name: "Jane Smith", age: 28, condition: "Hypertension" },
    { id: 3, name: "Amit Sharma", age: 45, condition: "Asthma" },
    { id: 4, name: "Sara Ali", age: 31, condition: "Migraine" },
];

export default function Patients() {
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");

    const filteredPatients = mockPatients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <main className="max-w-7xl mx-auto px-6 mt-10">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-semibold">Patients</h1>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {/* Toggle */}
                        <div className="flex border rounded-md overflow-hidden">
                            <button
                                className={`px-4 py-2 ${view === "grid"
                                    ? "bg-gray-900 text-white"
                                    : "bg-white"
                                    }`}
                                onClick={() => setView("grid")}
                            >
                                Grid
                            </button>
                            <button
                                className={`px-4 py-2 ${view === "list"
                                    ? "bg-gray-900 text-white"
                                    : "bg-white"
                                    }`}
                                onClick={() => setView("list")}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {view === "grid" ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filteredPatients.map((p) => (
                            <PatientCard key={p.id} patient={p} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border shadow-sm divide-y">
                        {filteredPatients.map((p) => (
                            <PatientRow key={p.id} patient={p} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
