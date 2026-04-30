import {
    Activity,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutGrid,
    List,
    MapPin,
    MoreVertical,
    Search,
    Stethoscope,
    Thermometer,
    UserRound
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import CloseButton from "../components/ui/CloseButton";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { PATIENT_STATUS, PatientStatus } from "../constants/patient";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import type { Patient, Visit } from "../types/patient";

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 8;

const SORT_OPTIONS = {
    NONE: "NONE",
    NAME_ASC: "NAME_ASC",
    AGE_ASC: "AGE_ASC",
    AGE_DESC: "AGE_DESC",
    LAST_VISIT_DESC: "LAST_VISIT_DESC",
    LAST_VISIT_ASC: "LAST_VISIT_ASC",
    ROOM_ASC: "ROOM_ASC",
} as const;

type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

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

function getStableRoomNumber(patient: Patient) {
    const patientIndex = mockPatients.findIndex((item) => item.id === patient.id);
    return getRoomNumber(patient, Math.max(0, patientIndex));
}

function getStatusSoftClass(status: PatientStatus) {
    if (status === PATIENT_STATUS.ACTIVE) return "bg-green-700";
    if (status === PATIENT_STATUS.CRITICAL) return "bg-red-700";
    return "bg-amber-700";
}

function StatusBadge({ status, isSelected = false }: { status: PatientStatus; isSelected?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${isSelected
            ? "bg-white text-[#0b1f4d]"
            : `text-white ${getStatusSoftClass(status)}`
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-current" : "bg-white"}`} />
            {formatLabel(status)}
        </span>
    );
}

function truncateText(value: string, maxLength = 96) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}...`;
}

function getSelectedTextClass(isSelected: boolean, defaultClass: string) {
    return isSelected ? "text-white" : defaultClass;
}

function getAgeFilterError(minAgeFilter: string, maxAgeFilter: string) {
    const min = minAgeFilter.trim();
    const max = maxAgeFilter.trim();
    const agePattern = /^\d+$/;

    if (min && !agePattern.test(min)) return "Minimum age must be a whole number.";
    if (max && !agePattern.test(max)) return "Maximum age must be a whole number.";

    const minAge = min ? Number(min) : null;
    const maxAge = max ? Number(max) : null;

    if (minAge !== null && minAge > 120) return "Minimum age must be 120 or less.";
    if (maxAge !== null && maxAge > 120) return "Maximum age must be 120 or less.";
    if (minAge !== null && maxAge !== null && minAge > maxAge) {
        return "Minimum age cannot be greater than maximum age.";
    }

    return "";
}

export default function Patients() {
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
    const [doctorFilter, setDoctorFilter] = useState("all");
    const [roomFilter, setRoomFilter] = useState("all");
    const [minAgeFilter, setMinAgeFilter] = useState("");
    const [maxAgeFilter, setMaxAgeFilter] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS.NONE);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [visitView, setVisitView] = useState<"timeline" | "cards">("timeline");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const detailsRef = useRef<HTMLDivElement | null>(null);
    const patientSelectionRef = useRef<HTMLDivElement | null>(null);
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
    const roomSelectOptions = [
        { label: "All Rooms", value: "all" },
        ...mockPatients.map((patient) => {
            const room = getStableRoomNumber(patient);

            return {
                label: room,
                value: room,
            };
        }),
    ];
    const sortOptions = [
        { label: "No Sort", value: SORT_OPTIONS.NONE },
        { label: "Name A-Z", value: SORT_OPTIONS.NAME_ASC },
        { label: "Age low-high", value: SORT_OPTIONS.AGE_ASC },
        { label: "Age high-low", value: SORT_OPTIONS.AGE_DESC },
        { label: "Recent visit", value: SORT_OPTIONS.LAST_VISIT_DESC },
        { label: "Oldest visit", value: SORT_OPTIONS.LAST_VISIT_ASC },
        { label: "Room number", value: SORT_OPTIONS.ROOM_ASC },
    ];
    const ageFilterError = getAgeFilterError(minAgeFilter, maxAgeFilter);
    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        doctorFilter !== "all" ||
        roomFilter !== "all" ||
        minAgeFilter.trim() !== "" ||
        maxAgeFilter.trim() !== "" ||
        sortBy !== SORT_OPTIONS.NONE;

    const clearAllFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setDoctorFilter("all");
        setRoomFilter("all");
        setMinAgeFilter("");
        setMaxAgeFilter("");
        setSortBy(SORT_OPTIONS.NONE);
    };

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

    const togglePatientSelection = (patient: Patient) => {
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

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!selected || !isDetailsOpen || selectedVisit) return;

            const target = event.target as Node;
            if (
                !detailsRef.current?.contains(target) &&
                !patientSelectionRef.current?.contains(target)
            ) {
                closeDetails();
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isDetailsOpen, selected, selectedVisit]);

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
            const matchesRoom =
                roomFilter === "all" || getStableRoomNumber(patient) === roomFilter;
            if (ageFilterError) return false;

            const minAge = Number(minAgeFilter);
            const maxAge = Number(maxAgeFilter);
            const matchesMinAge =
                !minAgeFilter.trim() || Number.isNaN(minAge) || patient.age >= minAge;
            const matchesMaxAge =
                !maxAgeFilter.trim() || Number.isNaN(maxAge) || patient.age <= maxAge;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesDoctor &&
                matchesRoom &&
                matchesMinAge &&
                matchesMaxAge
            );
        });
    }, [ageFilterError, debouncedSearch, doctorFilter, maxAgeFilter, minAgeFilter, roomFilter, statusFilter]);

    const sortedPatients = useMemo(() => {
        if (sortBy === SORT_OPTIONS.NONE) return filtered;

        return [...filtered].sort((a, b) => {
            if (sortBy === SORT_OPTIONS.AGE_ASC) return a.age - b.age;
            if (sortBy === SORT_OPTIONS.AGE_DESC) return b.age - a.age;
            if (sortBy === SORT_OPTIONS.LAST_VISIT_ASC) {
                return (a.lastVisitAt?.getTime() ?? 0) - (b.lastVisitAt?.getTime() ?? 0);
            }
            if (sortBy === SORT_OPTIONS.LAST_VISIT_DESC) {
                return (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0);
            }
            if (sortBy === SORT_OPTIONS.ROOM_ASC) {
                return getStableRoomNumber(a).localeCompare(getStableRoomNumber(b), undefined, {
                    numeric: true,
                });
            }

            return getFullName(a).localeCompare(getFullName(b));
        });
    }, [filtered, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, doctorFilter, maxAgeFilter, minAgeFilter, roomFilter, sortBy, statusFilter, view]);

    const pageSize = view === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(sortedPatients.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedPatients = sortedPatients.slice(
        pageStartIndex,
        pageStartIndex + pageSize,
    );
    const visibleStart = sortedPatients.length === 0 ? 0 : pageStartIndex + 1;
    const visibleEnd = Math.min(pageStartIndex + paginatedPatients.length, sortedPatients.length);
    const recordSummary = `Showing ${visibleStart} to ${visibleEnd} of ${sortedPatients.length} patients`;

    return (
        <div className="relative min-h-full bg-gray-50 pb-8">
            <div className="max-w-7xl mx-auto">
                <div className="my-2">
                    <h1 className="text-2xl font-semibold text-gray-950">Patients</h1>
                    <p className="text-sm text-gray-500">
                        Manage and monitor patient health records
                    </p>
                </div>

                <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Search patients..."
                            className="w-42 [&_input]:h-9 [&_input]:rounded-lg"
                            leftIcon={<Search className="h-4 w-4" />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <Select
                            className="w-28 [&_button]:h-9 [&_button]:rounded-lg"
                            value={statusFilter}
                            options={statusOptions}
                            onValueChange={(value) =>
                                setStatusFilter(value as PatientStatus | "all")
                            }
                            ariaLabel="Filter by status"
                        />

                        <Select
                            className="w-36 [&_button]:h-9 [&_button]:rounded-lg"
                            value={doctorFilter}
                            options={doctorSelectOptions}
                            onValueChange={setDoctorFilter}
                            ariaLabel="Filter by doctor"
                        />

                        <Select
                            className="w-32 [&_button]:h-9 [&_button]:rounded-lg"
                            value={roomFilter}
                            options={roomSelectOptions}
                            onValueChange={setRoomFilter}
                            ariaLabel="Filter by room number"
                        />

                        <Input
                            type="number"
                            min={0}
                            max={120}
                            step={1}
                            value={minAgeFilter}
                            onChange={(e) => setMinAgeFilter(e.target.value)}
                            placeholder="Min age"
                            className="w-28 [&_input]:h-9 [&_input]:rounded-lg"
                            inputClassName={ageFilterError ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/10" : ""}
                        />

                        <Input
                            type="number"
                            min={0}
                            max={120}
                            step={1}
                            value={maxAgeFilter}
                            onChange={(e) => setMaxAgeFilter(e.target.value)}
                            placeholder="Max age"
                            className="w-28 [&_input]:h-9 [&_input]:rounded-lg"
                            inputClassName={ageFilterError ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/10" : ""}
                        />

                        <Select
                            className="w-39 [&_button]:h-9 [&_button]:rounded-lg"
                            value={sortBy}
                            options={sortOptions}
                            onValueChange={(value) => setSortBy(value as SortOption)}
                            ariaLabel="Sort patients"
                        />

                        <button
                            type="button"
                            onClick={clearAllFilters}
                            disabled={!hasActiveFilters}
                            className="h-9 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Clear all
                        </button>

                        <div className="flex overflow-hidden rounded-md border-2 border-[#0b1f4d] divide-x-2 divide-[#0b1f4d]">
                            <button
                                aria-label="Grid view"
                                title="Grid view"
                                className={`grid h-9 w-10 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "grid" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className="h-5 w-5" />
                            </button>
                            <button
                                aria-label="List view"
                                title="List view"
                                className={`grid h-9 w-10 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "list" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                                onClick={() => setView("list")}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {ageFilterError && (
                        <p className="mt-2 text-sm text-red-600">
                            {ageFilterError}
                        </p>
                    )}
                </div>

                <div ref={patientSelectionRef}>
                    {loading ? (
                        <div className="grid md:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : sortedPatients.length === 0 && view === "grid" ? (
                        <div className="text-center py-20 text-gray-500">
                            No patients found.
                        </div>
                    ) : view === "grid" ? (
                        <>
                        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {paginatedPatients.map((patient) => {
                                const isSelected = selected?.id === patient.id && isDetailsOpen;

                                return (
                                    <div
                                        key={patient.id}
                                        onClick={() => togglePatientSelection(patient)}
                                        className={`cursor-pointer rounded-lg p-4 ring-1 ring-gray-200 transition active:scale-[0.99] ${isSelected
                                            ? "bg-[#0b1f4d] text-white"
                                            : "bg-white text-gray-800 hover:bg-gray-50 hover:text-[#0b1f4d]"
                                            }`}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <StatusBadge status={patient.status} isSelected={isSelected} />
                                            <span className={`text-sm ${getSelectedTextClass(isSelected, "text-gray-500")}`}>
                                                {formatDate(patient.lastVisitAt)}
                                            </span>
                                        </div>

                                        <p className="font-semibold leading-tight">{getFullName(patient)}</p>
                                        <p className={`mt-1 text-sm ${getSelectedTextClass(isSelected, "text-gray-600")}`}>
                                            {getPrimaryCondition(patient)}
                                        </p>

                                        <div className={`mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-sm ${isSelected ? "border-white/20" : "border-gray-100"}`}>
                                            <p className="inline-flex items-center gap-2">
                                                <UserRound className="h-4 w-4" />
                                                {patient.age} yrs
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                {patient.visits.length} {patient.visits.length === 1 ? "visit" : "visits"}
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                {patient.notes.length} {patient.notes.length === 1 ? "note" : "notes"}
                                            </p>
                                        </div>

                                        <p className={`mt-3 inline-flex items-center gap-2 text-sm ${getSelectedTextClass(isSelected, "text-gray-600")}`}>
                                            <MapPin className="h-4 w-4" />
                                            {patient.address.city}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <p>{recordSummary}</p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }).map((_, index) => {
                                    const page = index + 1;

                                    return (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-10 min-w-10 cursor-pointer rounded-md border px-3 font-medium transition active:scale-[0.98] ${safeCurrentPage === page
                                                ? "border-[#0b1f4d] bg-[#0b1f4d] text-white"
                                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <div />
                        </div>
                        </>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                        <div className="max-h-180 overflow-auto">
                            <table className="w-full min-w-245 border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-0 bg-white">
                                    <tr className="border-y border-gray-100 text-xs font-medium text-gray-500">
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
                                                colSpan={8}
                                                className="px-5 py-12 text-center text-sm text-gray-500"
                                            >
                                                No patients match the criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPatients.map((patient) => {
                                            const doctor = getDoctorMeta(patient);
                                            const insured = patient.insurance.isActive;
                                            const isSelected = selected?.id === patient.id && isDetailsOpen;

                                            return (
                                                <tr
                                                    key={patient.id}
                                                    onClick={() => togglePatientSelection(patient)}
                                                    className={`cursor-pointer border-b border-gray-100 transition active:bg-gray-100 ${isSelected
                                                        ? "bg-[#0b1f4d] text-white hover:bg-[#0b1f4d]"
                                                        : "hover:bg-gray-50/80"
                                                        }`}
                                                >
                                                    <td className={`whitespace-nowrap px-3 py-3 ${getSelectedTextClass(isSelected, "text-gray-900")}`}>
                                                        {formatDate(patient.lastVisitAt)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${isSelected
                                                                ? "bg-white text-[#0b1f4d]"
                                                                : "bg-gray-100 text-gray-700"
                                                                }`}>
                                                                {getInitials(patient)}
                                                            </div>
                                                            <div>
                                                                <p className={`font-medium ${getSelectedTextClass(isSelected, "text-gray-950")}`}>
                                                                    {getFullName(patient)}
                                                                </p>
                                                                <p className={`text-xs ${getSelectedTextClass(isSelected, "text-gray-500")}`}>
                                                                    {patient.age} Years - {formatLabel(patient.gender)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`max-w-42.5 truncate px-3 py-3 ${getSelectedTextClass(isSelected, "text-gray-900")}`}>
                                                        {getPrimaryCondition(patient)}
                                                    </td>
                                                    <td className={`whitespace-nowrap px-3 py-3 font-medium ${getSelectedTextClass(isSelected, "text-gray-900")}`}>
                                                        {getStableRoomNumber(patient)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${isSelected
                                                                ? "bg-white text-[#0b1f4d]"
                                                                : "bg-stone-100 text-stone-700"
                                                                }`}>
                                                                {doctor.name
                                                                    .split(" ")
                                                                    .slice(-2)
                                                                    .map((part) => part.charAt(0))
                                                                    .join("")}
                                                            </div>
                                                            <div>
                                                                <p className={`max-w-37.5 truncate font-medium ${getSelectedTextClass(isSelected, "text-gray-950")}`}>
                                                                    {doctor.name}
                                                                </p>
                                                                <p className={`text-xs ${getSelectedTextClass(isSelected, "text-gray-500")}`}>
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
                                                        <StatusBadge status={patient.status} isSelected={isSelected} />
                                                    </td>
                                                    <td className={`px-5 py-3 text-right text-xl leading-none ${getSelectedTextClass(isSelected, "text-gray-400")}`}>
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
                            <div className="ml-auto flex items-center gap-2">
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
                </div>

                {selected && (
                    <div
                        ref={detailsRef}
                        className={`fixed right-0 top-18.25 bottom-0 z-40 w-full max-w-xl overflow-y-auto bg-white p-6 transition-all duration-300 ease-out ${isDetailsOpen
                            ? "translate-x-0 opacity-100"
                            : "translate-x-full opacity-0"
                            }`}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">{getFullName(selected)}</h2>
                                <p className="text-gray-500">
                                    {selected.chronicConditions.join(", ") || "No chronic conditions"}
                                </p>
                            </div>
                            <CloseButton
                                onClick={closeDetails}
                                label="Close patient details"
                            />
                        </div>

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
                                            <span className="absolute -left-5 top-4 h-3 w-3 rounded-full border-2 border-white bg-[#0b1f4d]" />
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
                        className="absolute inset-0 z-40 flex items-center justify-center px-4"
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
                                <CloseButton
                                    onClick={() => setSelectedVisit(null)}
                                    label="Close visit details"
                                />
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
                                                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Stethoscope className="h-3.5 w-3.5" />
                                                    Blood Pressure
                                                </p>
                                                <p className="font-medium text-gray-800">
                                                    {selectedVisit.vitals.bloodPressure ?? "N/A"}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Activity className="h-3.5 w-3.5" />
                                                    Heart Rate
                                                </p>
                                                <p className="font-medium text-gray-800">
                                                    {selectedVisit.vitals.heartRate ?? "N/A"}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Thermometer className="h-3.5 w-3.5" />
                                                    Temperature
                                                </p>
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
