import { LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PATIENT_STATUS, PatientStatus } from "../constants/patient";
import { mockPatients } from "../data/patients";
import type { Patient } from "../types/patient";

const LIST_PAGE_SIZE = 10;

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

function getInitials(patient: Patient) {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
}

function getLatestVisit(patient: Patient) {
    return patient.visits[patient.visits.length - 1];
}

function getDoctorMeta(patient: Patient) {
    const visit = getLatestVisit(patient);

    return {
        name: visit?.doctorName ?? "Unassigned",
        specialty: visit?.type ? formatLabel(visit.type) : "General",
    };
}

function getRoomNumber(patient: Patient, index: number) {
    const number = 101 + index;
    const prefix = patient.status === PATIENT_STATUS.CRITICAL ? "E" : "R";

    return `${prefix}-${number}`;
}

function getStatusClass(status: PatientStatus) {
    if (status === PATIENT_STATUS.ACTIVE) {
        return "bg-green-50 text-green-700";
    }

    if (status === PATIENT_STATUS.CRITICAL) {
        return "bg-red-50 text-red-600";
    }

    return "bg-amber-50 text-amber-600";
}

export default function Patients() {
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
    const [selected, setSelected] = useState<Patient | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const closeTimerRef = useRef<number | null>(null);

    const debouncedSearch = useDebounce(search);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    const openDetails = (patient: Patient) => {
        if (selected?.id === patient.id && isDetailsOpen) {
            closeDetails();
            return;
        }

        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setSelected(patient);

        if (selected) {
            setIsDetailsOpen(true);
            return;
        }

        requestAnimationFrame(() => setIsDetailsOpen(true));
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        closeTimerRef.current = window.setTimeout(() => {
            setSelected(null);
            closeTimerRef.current = null;
        }, 250);
    };

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
                p.insurance.provider,
                p.insurance.policyNumber,
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

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, view]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safeCurrentPage - 1) * LIST_PAGE_SIZE;
    const paginatedPatients = filtered.slice(
        pageStartIndex,
        pageStartIndex + LIST_PAGE_SIZE,
    );

    return (
        <div className="min-h-full bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Patients</h1>
                        <p className="text-sm text-gray-500">
                            {filtered.length} of {mockPatients.length} records
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        {view === "grid" && (
                            <>
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
                            </>
                        )}

                        <div className="flex border rounded-md overflow-hidden">
                            <button
                                aria-label="Grid view"
                                title="Grid view"
                                className={`grid h-10 w-12 place-items-center ${view === "grid" ? "bg-black text-white" : ""}`}
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className="h-5 w-5" />
                            </button>
                            <button
                                aria-label="List view"
                                title="List view"
                                className={`grid h-10 w-12 place-items-center ${view === "list" ? "bg-black text-white" : ""}`}
                                onClick={() => setView("list")}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

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
                                onClick={() => openDetails(p)}
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
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                        <div className="flex flex-col gap-5 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="text-base font-semibold text-gray-950">
                                Inpatient Patients List
                            </h2>

                            <button className="inline-flex items-center gap-2 self-start rounded-full bg-gray-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 lg:self-auto">
                                <span className="text-lg leading-none">+</span>
                                Add New Patient
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 px-5 pb-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex w-full gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 text-sm lg:w-auto">
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={`whitespace-nowrap rounded-full px-4 py-2 ${statusFilter === "all" ? "bg-white shadow-sm" : "text-gray-600"}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStatusFilter(PATIENT_STATUS.INACTIVE)}
                                    className={`whitespace-nowrap rounded-full px-4 py-2 ${statusFilter === PATIENT_STATUS.INACTIVE ? "bg-white shadow-sm" : "text-gray-600"}`}
                                >
                                    Discharged
                                </button>
                                <button
                                    onClick={() => setStatusFilter(PATIENT_STATUS.CRITICAL)}
                                    className={`whitespace-nowrap rounded-full px-4 py-2 ${statusFilter === PATIENT_STATUS.CRITICAL ? "bg-white shadow-sm" : "text-gray-600"}`}
                                >
                                    Emergency Cases
                                </button>
                                <button className="whitespace-nowrap rounded-full px-4 py-2 text-gray-600">
                                    Follow Up
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="flex h-10 items-center gap-2 rounded-full bg-gray-100 px-4">
                                    <span className="text-gray-500">Search</span>
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-36 bg-transparent text-sm outline-none placeholder:text-gray-500"
                                    />
                                </div>
                                <button className="h-10 rounded-full bg-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-200">
                                    Filter
                                </button>
                                <button className="h-10 rounded-full bg-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-200">
                                    Sort By
                                </button>
                            </div>
                        </div>

                        <div className="max-h-180 overflow-auto">
                            <table className="w-full min-w-245 border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-white">
                                    <tr className="border-y border-gray-100 text-xs font-medium text-gray-500">
                                        <th className="w-12 px-5 py-3">
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                        </th>
                                        <th className="px-3 py-3">Admission Date</th>
                                        <th className="px-3 py-3">Patient</th>
                                        <th className="px-3 py-3">Diagnosis</th>
                                        <th className="px-3 py-3">Room Number</th>
                                        <th className="px-3 py-3">Assigned Doctor</th>
                                        <th className="px-3 py-3 text-center">Insurance</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="w-12 px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPatients.map((p, index) => {
                                        const doctor = getDoctorMeta(p);
                                        const insured = p.insurance.isActive;
                                        const patientIndex = pageStartIndex + index;

                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => openDetails(p)}
                                                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50/80"
                                            >
                                                <td className="px-5 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-gray-900">
                                                    {formatDate(p.lastVisitAt)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                                                            {getInitials(p)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-950">
                                                                {getFullName(p)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {p.age} Years - {formatLabel(p.gender)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="max-w-42.5 truncate px-3 py-3 text-gray-900">
                                                    {getPrimaryCondition(p)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                                                    {getRoomNumber(p, patientIndex)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">
                                                            {doctor.name
                                                                .split(" ")
                                                                .slice(-2)
                                                                .map((part) => part.charAt(0))
                                                                .join("")}
                                                        </div>
                                                        <div>
                                                            <p className="max-w-37.5 truncate font-medium text-gray-950">
                                                                {doctor.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {doctor.specialty}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span
                                                        className={`inline-grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${insured
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-200 text-gray-400"
                                                            }`}
                                                    >
                                                        {insured ? "✓" : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(p.status)}`}
                                                    >
                                                        {formatLabel(p.status)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right text-xl leading-none text-gray-400">
                                                    ...
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                Showing {pageStartIndex + 1}-
                                {Math.min(pageStartIndex + paginatedPatients.length, filtered.length)} of{" "}
                                {filtered.length} patients
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(1, page - 1))
                                    }
                                    disabled={safeCurrentPage === 1}
                                    className="rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="rounded-full bg-gray-100 px-3 py-2 text-gray-700">
                                    {safeCurrentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                                    }
                                    disabled={safeCurrentPage === totalPages}
                                    className="rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selected && (
                    <div
                        className={`fixed right-0 top-18.25 bottom-0 w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl transition-all duration-300 ease-out ${isDetailsOpen
                            ? "translate-x-0 opacity-100"
                            : "translate-x-full opacity-0"
                            }`}
                    >
                        <button
                            onClick={closeDetails}
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
                            <p>
                                Insurance: {selected.insurance.provider} (
                                {selected.insurance.isActive ? "Active" : "Inactive"})
                            </p>
                            <p>Policy: {selected.insurance.policyNumber}</p>
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
                                                BP {visit.vitals.bloodPressure ?? "N/A"} - HR{" "}
                                                {visit.vitals.heartRate ?? "N/A"} - Temp{" "}
                                                {visit.vitals.temperature ?? "N/A"} F
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

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
