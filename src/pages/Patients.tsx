import { useEffect, useMemo, useState } from "react";
import { PATIENT_STATUS, PatientStatus } from "../constants/patient";
import { mockPatients } from "../data/patients";
import type { Patient } from "../types/patient";

function useDebounce<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}

function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

function getPrimaryCondition(patient: Patient) {
    return patient.chronicConditions[0] ?? "General care";
}

function formatDate(date?: Date) {
    if (!date) return "Not visited yet";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatLabel(value: string) {
    return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function Patients() {
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
    const [selected, setSelected] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const debouncedSearch = useDebounce(search);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(t);
    }, []);

    const filtered = useMemo(() => {
        return mockPatients.filter((p) => {
            const query = debouncedSearch.toLowerCase();
            const searchable = [
                getFullName(p),
                p.email,
                p.phone,
                p.address.city,
                p.address.state,
                p.bloodGroup ?? "",
                ...p.allergies,
                ...p.chronicConditions,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchable.includes(query);
            const matchesStatus = statusFilter === "all" || p.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [debouncedSearch, statusFilter]);

    return (
        <div className="min-h-full bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Patients</h1>
                        <p className="text-sm text-gray-500">
                            {filtered.length} of {mockPatients.length} records
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            placeholder="Search patients..."
                            className="px-4 py-2 border rounded-md"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="px-3 py-2 border rounded-md"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as PatientStatus | "all")
                            }
                        >
                            <option value="all">All</option>
                            <option value={PATIENT_STATUS.ACTIVE}>Active</option>
                            <option value={PATIENT_STATUS.INACTIVE}>Inactive</option>
                            <option value={PATIENT_STATUS.CRITICAL}>Critical</option>
                        </select>

                        <div className="flex border rounded-md overflow-hidden">
                            <button
                                className={`px-4 py-2 ${view === "grid" ? "bg-black text-white" : ""}`}
                                onClick={() => setView("grid")}
                            >
                                Grid
                            </button>
                            <button
                                className={`px-4 py-2 ${view === "list" ? "bg-black text-white" : ""}`}
                                onClick={() => setView("list")}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="grid md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No patients found.
                    </div>
                ) : view === "grid" ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filtered.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => setSelected(p)}
                                className="cursor-pointer p-4 rounded-xl bg-white shadow hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold">{getFullName(p)}</h2>
                                        <p className="text-sm text-gray-500">
                                            {getPrimaryCondition(p)}
                                        </p>
                                    </div>
                                    <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                                        {formatLabel(p.status)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <p>Age: {p.age}</p>
                                    <p>Visits: {p.visits.length}</p>
                                    <p>Notes: {p.notes.length}</p>
                                    <p>{p.address.city}</p>
                                    <p className="col-span-2 text-gray-600">
                                        Last visit: {formatDate(p.lastVisitAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border divide-y">
                        {filtered.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => setSelected(p)}
                                className="p-4 flex justify-between gap-4 cursor-pointer hover:bg-gray-50"
                            >
                                <div>
                                    <p className="font-medium">{getFullName(p)}</p>
                                    <p className="text-sm text-gray-500">
                                        {getPrimaryCondition(p)} · {p.address.city}
                                    </p>
                                </div>
                                <div className="text-sm text-right">
                                    <p>{formatLabel(p.status)}</p>
                                    <p className="text-gray-500">{formatDate(p.lastVisitAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Drawer */}
                {selected && (
                    <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-6 overflow-y-auto">
                        <button
                            onClick={() => setSelected(null)}
                            className="mb-4 text-sm text-gray-500"
                        >
                            Close
                        </button>

                        <h2 className="text-xl font-semibold">{getFullName(selected)}</h2>
                        <p className="text-gray-500">
                            {selected.chronicConditions.join(", ") || "No chronic conditions"}
                        </p>

                        <div className="mt-4 space-y-2 text-sm">
                            <p>Age: {selected.age}</p>
                            <p>Gender: {formatLabel(selected.gender)}</p>
                            <p>Status: {formatLabel(selected.status)}</p>
                            <p>Blood group: {selected.bloodGroup ?? "Not recorded"}</p>
                            <p>Phone: {selected.phone}</p>
                            <p>Email: {selected.email}</p>
                            <p>
                                Address: {selected.address.line1}
                                {selected.address.line2 ? `, ${selected.address.line2}` : ""},{" "}
                                {selected.address.city}, {selected.address.state}{" "}
                                {selected.address.zip}
                            </p>
                            <p>
                                Allergies: {selected.allergies.join(", ") || "None recorded"}
                            </p>
                            <p>Last Visit: {formatDate(selected.lastVisitAt)}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-medium mb-2">Visits</h3>
                            <div className="space-y-3">
                                {selected.visits.map((visit) => (
                                    <div key={visit.id} className="text-sm bg-gray-50 p-3 rounded">
                                        <div className="flex justify-between gap-3">
                                            <p className="font-medium">{visit.type}</p>
                                            <p className="text-gray-500">{formatDate(visit.date)}</p>
                                        </div>
                                        <p className="text-gray-600">{visit.doctorName}</p>
                                        <p className="mt-2">{visit.summary}</p>
                                        {visit.diagnosis && (
                                            <p className="mt-2">
                                                <span className="font-medium">Diagnosis:</span>{" "}
                                                {visit.diagnosis}
                                            </p>
                                        )}
                                        {visit.prescription && (
                                            <p className="mt-2">
                                                <span className="font-medium">Prescription:</span>{" "}
                                                {visit.prescription}
                                            </p>
                                        )}
                                        {visit.vitals && (
                                            <p className="mt-2 text-gray-600">
                                                BP {visit.vitals.bloodPressure ?? "N/A"} · HR{" "}
                                                {visit.vitals.heartRate ?? "N/A"} · Temp{" "}
                                                {visit.vitals.temperature ?? "N/A"} F
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6">
                            <h3 className="font-medium mb-2">Notes</h3>
                            {selected.notes.length === 0 ? (
                                <p className="text-sm text-gray-400">No notes</p>
                            ) : (
                                <ul className="space-y-2">
                                    {selected.notes.map((note) => (
                                        <li key={note.id} className="text-sm bg-gray-100 p-2 rounded">
                                            <div className="flex justify-between gap-3">
                                                <span className="font-medium">{note.type}</span>
                                                <span className="text-gray-500">
                                                    {formatDate(note.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-1">{note.content}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                By {note.createdBy}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
