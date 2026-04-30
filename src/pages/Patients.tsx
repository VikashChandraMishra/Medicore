import { Check, LayoutGrid, List, MoreVertical, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { PATIENT_STATUS, PatientStatus } from "../constants/patient";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import type { Patient, Visit } from "../types/patient";

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

function getDoctorName(doctorId?: string) {
    if (!doctorId) return "Unassigned";

    return mockDoctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
}

function getDoctorMeta(patient: Patient) {
    const visit = getLatestVisit(patient);

    return {
        name: getDoctorName(visit?.doctorId),
        specialty: visit?.type ? formatLabel(visit.type) : "General",
    };
}

function getRoomNumber(patient: Patient, index: number) {
    const number = 101 + index;
    const prefix = patient.status === PATIENT_STATUS.CRITICAL ? "E" : "R";

    return `${prefix}-${number}`;
}

function getStatusClass(status: PatientStatus) {
    if (status === PATIENT_STATUS.ACTIVE) return "bg-green-50 text-green-700";
    if (status === PATIENT_STATUS.CRITICAL) return "bg-red-50 text-red-600";
    return "bg-amber-50 text-amber-600";
}

function truncateText(value: string, maxLength = 96) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}...`;
}

export default function Patients() {
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
    const [doctorFilter, setDoctorFilter] = useState("all");
    const [selected, setSelected] = useState<Patient | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [visitView, setVisitView] = useState<"timeline" | "cards">("timeline");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const closeTimerRef = useRef<number | null>(null);

    const debouncedSearch = useDebounce(search);

    const doctorOptions = useMemo(() => {
        const doctors = mockPatients.map((patient) => getDoctorMeta(patient).name);
        return Array.from(new Set(doctors)).sort((a, b) => a.localeCompare(b));
    }, []);

    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Active", value: PATIENT_STATUS.ACTIVE },
        { label: "Inactive", value: PATIENT_STATUS.INACTIVE },
        { label: "Critical", value: PATIENT_STATUS.CRITICAL },
    ];

    const doctorSelectOptions = [
        { label: "All Doctors", value: "all" },
        ...doctorOptions.map((doctor) => ({
            label: doctor,
            value: doctor,
        })),
    ];

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

    useEffect(() => {
        const patientId = searchParams.get("patientId");
        if (!patientId) return;

        const patient = mockPatients.find((item) => item.id === patientId);
        if (!patient) return;

        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setSelected(patient);
        setSelectedVisit(null);
        requestAnimationFrame(() => setIsDetailsOpen(true));
    }, [searchParams]);

    const closeDetails = () => {
        setSelectedVisit(null);
        setIsDetailsOpen(false);
        closeTimerRef.current = window.setTimeout(() => {
            setSelected(null);
            closeTimerRef.current = null;
        }, 250);
    };

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

    const filtered = useMemo(() => {
        return mockPatients.filter((patient) => {
            const query = debouncedSearch.toLowerCase();
            const searchable = [
                getFullName(patient),
                patient.email,
                patient.phone,
                patient.address.city,
                patient.address.state,
                patient.bloodGroup ?? "",
                patient.insurance.provider,
                patient.insurance.policyNumber,
                ...patient.allergies,
                ...patient.chronicConditions,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchable.includes(query);
            const matchesStatus =
                statusFilter === "all" || patient.status === statusFilter;
            const matchesDoctor =
                doctorFilter === "all" || getDoctorMeta(patient).name === doctorFilter;

            return matchesSearch && matchesStatus && matchesDoctor;
        });
    }, [debouncedSearch, doctorFilter, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, doctorFilter, statusFilter, view]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safeCurrentPage - 1) * LIST_PAGE_SIZE;
    const paginatedPatients = filtered.slice(
        pageStartIndex,
        pageStartIndex + LIST_PAGE_SIZE,
    );

    return (
        <div className="relative h-full bg-gray-50">
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
                                <Input
                                    placeholder="Search patients..."
                                    className="w-56"
                                    leftIcon={<Search className="h-4 w-4" />}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                <Select
                                    className="w-36"
                                    value={statusFilter}
                                    options={statusOptions}
                                    onValueChange={(value) =>
                                        setStatusFilter(value as PatientStatus | "all")
                                    }
                                    ariaLabel="Filter by status"
                                />

                                <Select
                                    className="w-48"
                                    value={doctorFilter}
                                    options={doctorSelectOptions}
                                    onValueChange={setDoctorFilter}
                                    ariaLabel="Filter by doctor"
                                />
                            </>
                        )}

                        <div className="flex overflow-hidden rounded-md border-2 border-[#0b1f4d] divide-x-2 divide-[#0b1f4d]">
                            <button
                                aria-label="Grid view"
                                title="Grid view"
                                className={`grid h-10 w-12 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "grid" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className="h-5 w-5" />
                            </button>
                            <button
                                aria-label="List view"
                                title="List view"
                                className={`grid h-10 w-12 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "list" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
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
                ) : filtered.length === 0 && view === "grid" ? (
                    <div className="text-center py-20 text-gray-500">
                        No patients found.
                    </div>
                ) : view === "grid" ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filtered.map((patient) => (
                            <div
                                key={patient.id}
                                onClick={() => openDetails(patient)}
                                className="cursor-pointer rounded-xl bg-white p-4 shadow transition hover:shadow-md active:scale-[0.99]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold">{getFullName(patient)}</h2>
                                        <p className="text-sm text-gray-500">
                                            {getPrimaryCondition(patient)}
                                        </p>
                                    </div>
                                    <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                                        {formatLabel(patient.status)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <p>Age: {patient.age}</p>
                                    <p>Visits: {patient.visits.length}</p>
                                    <p>Notes: {patient.notes.length}</p>
                                    <p>{patient.address.city}</p>
                                    <p className="col-span-2 text-gray-600">
                                        Last visit: {formatDate(patient.lastVisitAt)}
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

                            <button className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#0b1f4d] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#102a63] active:scale-[0.98] lg:self-auto">
                                <Plus className="h-4 w-4" />
                                Add New Patient
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
                            <div className="flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 text-sm">
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 transition active:scale-[0.98] ${statusFilter === "all" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStatusFilter(PATIENT_STATUS.INACTIVE)}
                                    className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 transition active:scale-[0.98] ${statusFilter === PATIENT_STATUS.INACTIVE ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                                >
                                    Discharged
                                </button>
                                <button
                                    onClick={() => setStatusFilter(PATIENT_STATUS.CRITICAL)}
                                    className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 transition active:scale-[0.98] ${statusFilter === PATIENT_STATUS.CRITICAL ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                                >
                                    Emergency Cases
                                </button>
                                <button className="cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-gray-500 transition hover:text-gray-800 active:scale-[0.98]">
                                    Follow Up
                                </button>
                            </div>

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <Select
                                    className="w-48"
                                    value={doctorFilter}
                                    options={doctorSelectOptions}
                                    onValueChange={setDoctorFilter}
                                    ariaLabel="Filter by doctor"
                                />

                                <Select
                                    className="w-40"
                                    value={statusFilter}
                                    options={statusOptions}
                                    onValueChange={(value) =>
                                        setStatusFilter(value as PatientStatus | "all")
                                    }
                                    ariaLabel="Filter by status"
                                />

                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    leftIcon={<Search className="h-4 w-4" />}
                                    className="w-64"
                                />

                                <button className="h-12 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]">
                                    Sort By
                                </button>
                            </div>
                        </div>

                        <div className="max-h-180 overflow-auto">
                            <table className="w-full min-w-245 border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-0 bg-white">
                                    <tr className="border-y border-gray-100 text-xs font-medium text-gray-500">
                                        <th className="w-12 px-5 py-3">
                                            <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-gray-300" />
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
                                    {paginatedPatients.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-5 py-12 text-center text-sm text-gray-500"
                                            >
                                                No patients match the criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPatients.map((patient, index) => {
                                            const doctor = getDoctorMeta(patient);
                                            const insured = patient.insurance.isActive;
                                            const patientIndex = pageStartIndex + index;

                                            return (
                                                <tr
                                                    key={patient.id}
                                                    onClick={() => openDetails(patient)}
                                                className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/80 active:bg-gray-100"
                                                >
                                                    <td className="px-5 py-3">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 cursor-pointer rounded border-gray-300"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-gray-900">
                                                        {formatDate(patient.lastVisitAt)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                                                                {getInitials(patient)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-950">
                                                                    {getFullName(patient)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {patient.age} Years - {formatLabel(patient.gender)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="max-w-42.5 truncate px-3 py-3 text-gray-900">
                                                        {getPrimaryCondition(patient)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                                                        {getRoomNumber(patient, patientIndex)}
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
                                                            {insured ? <Check className="h-3 w-3" /> : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(patient.status)}`}
                                                        >
                                                            {formatLabel(patient.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-xl leading-none text-gray-400">
                                                        <MoreVertical className="ml-auto h-4 w-4" />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                Showing {filtered.length === 0 ? 0 : pageStartIndex + 1}-
                                {Math.min(pageStartIndex + paginatedPatients.length, filtered.length)} of{" "}
                                {filtered.length} patients
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(1, page - 1))
                                    }
                                    disabled={safeCurrentPage === 1}
                                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
                                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selected && (
                    <div
                        className={`fixed right-0 top-18.25 bottom-0 z-40 w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl transition-all duration-300 ease-out ${isDetailsOpen
                            ? "translate-x-0 opacity-100"
                            : "translate-x-full opacity-0"
                            }`}
                    >
                        <button
                            onClick={closeDetails}
                            className="mb-4 cursor-pointer text-sm text-gray-500 transition hover:text-gray-800 active:scale-[0.98]"
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
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="font-medium">Visits</h3>
                                <div className="flex overflow-hidden rounded-md border border-gray-200">
                                    <button
                                        onClick={() => setVisitView("timeline")}
                                        className={`cursor-pointer px-3 py-1.5 text-xs transition active:scale-[0.98] ${visitView === "timeline" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                                    >
                                        Timeline
                                    </button>
                                    <button
                                        onClick={() => setVisitView("cards")}
                                        className={`cursor-pointer px-3 py-1.5 text-xs transition active:scale-[0.98] ${visitView === "cards" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                                    >
                                        Detail
                                    </button>
                                </div>
                            </div>

                            {visitView === "timeline" ? (
                                <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gray-200">
                                    {selected.visits.map((visit, index) => (
                                        <button
                                            key={`${selected.id}-visit-${index}`}
                                            onClick={() => setSelectedVisit(visit)}
                                            className="relative w-full cursor-pointer rounded-xl bg-gray-50 p-3 text-left text-sm transition hover:bg-gray-100 active:scale-[0.99]"
                                        >
                                            <span className="absolute -left-5 top-4 h-3 w-3 rounded-full border-2 border-white bg-[#0b1f4d] shadow" />
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-gray-800">{visit.type}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {getDoctorName(visit.doctorId)}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-xs text-gray-500">
                                                    {formatDate(visit.date)}
                                                </p>
                                            </div>
                                            <p className="mt-2 text-gray-600">
                                                {truncateText(visit.summary)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selected.visits.map((visit, index) => (
                                        <button
                                            key={`${selected.id}-visit-card-${index}`}
                                            onClick={() => setSelectedVisit(visit)}
                                            className="w-full cursor-pointer rounded-xl bg-gray-50 p-3 text-left text-sm transition hover:bg-gray-100 active:scale-[0.99]"
                                        >
                                            <div className="flex justify-between gap-3">
                                                <p className="font-medium">{visit.type}</p>
                                                <p className="text-gray-500">{formatDate(visit.date)}</p>
                                            </div>
                                            <p className="text-gray-600">{getDoctorName(visit.doctorId)}</p>
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
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <h3 className="font-medium mb-2">Notes</h3>
                            {selected.notes.length === 0 ? (
                                <p className="text-sm text-gray-400">No notes</p>
                            ) : (
                                <ul className="space-y-2">
                                    {selected.notes.map((note, index) => (
                                        <li key={`${selected.id}-note-${index}`} className="text-sm bg-gray-100 p-2 rounded">
                                            <div className="flex justify-between gap-3">
                                                <span className="font-medium">{note.type}</span>
                                                <span className="text-gray-500">
                                                    {formatDate(note.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-1">{note.content}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                By {getDoctorName(note.doctorId)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {selectedVisit && (
                    <div
                        className="absolute inset-0 z-40 flex items-center justify-center bg-gray-950/35 px-4"
                        onClick={() => setSelectedVisit(null)}
                    >
                        <div
                            className="max-h-[calc(100%-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(selectedVisit.date)}
                                    </p>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {selectedVisit.type}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {getDoctorName(selectedVisit.doctorId)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 active:scale-[0.95]"
                                    aria-label="Close visit details"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="font-medium text-gray-800">Summary</p>
                                    <p className="mt-1 text-gray-600">{selectedVisit.summary}</p>
                                </div>

                                <div>
                                    <p className="font-medium text-gray-800">Symptoms</p>
                                    <p className="mt-1 text-gray-600">
                                        {selectedVisit.symptoms.join(", ")}
                                    </p>
                                </div>

                                {selectedVisit.diagnosis && (
                                    <div>
                                        <p className="font-medium text-gray-800">Diagnosis</p>
                                        <p className="mt-1 text-gray-600">
                                            {selectedVisit.diagnosis}
                                        </p>
                                    </div>
                                )}

                                {selectedVisit.prescription && (
                                    <div>
                                        <p className="font-medium text-gray-800">Prescription</p>
                                        <p className="mt-1 text-gray-600">
                                            {selectedVisit.prescription}
                                        </p>
                                    </div>
                                )}

                                {selectedVisit.vitals && (
                                    <div>
                                        <p className="font-medium text-gray-800">Vitals</p>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Blood Pressure</p>
                                                <p className="font-medium text-gray-800">
                                                    {selectedVisit.vitals.bloodPressure ?? "N/A"}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Heart Rate</p>
                                                <p className="font-medium text-gray-800">
                                                    {selectedVisit.vitals.heartRate ?? "N/A"}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Temperature</p>
                                                <p className="font-medium text-gray-800">
                                                    {selectedVisit.vitals.temperature ?? "N/A"} F
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500">
                                    Created {formatDate(selectedVisit.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
