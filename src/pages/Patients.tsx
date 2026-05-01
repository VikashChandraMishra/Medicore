import {
    Activity,
    Check,
    FileText,
    MapPin,
    MoreVertical,
    UserRound
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import PatientDetailsPanel from "../components/patients/PatientDetailsPanel";
import PatientFiltersToolbar from "../components/patients/PatientFiltersToolbar";
import PatientPagination from "../components/patients/PatientPagination";
import VisitDetailsModal from "../components/patients/VisitDetailsModal";
import DataTable from "../components/ui/DataTable";
import { PATIENT_STATUS, PatientStatus } from "../constants/patient";
import { THEME } from "../constants/theme";
import useAuth from "../hooks/use-auth";
import useDebounce from "../hooks/use-debounce";
import type { Patient, Visit } from "../types/patient";
import { formatLabel } from "../utils/format";
import { getInitialsFromName } from "../utils/initials";
import { getScopedPatientsForEmail } from "../utils/patient-scope";
import { getFullName } from "../utils/people";
import {
    filterPatients,
    formatPatientDate,
    getAgeFilterError,
    getDoctorMeta,
    getPatientInitials,
    getPrimaryCondition,
    getSelectedTextClass,
    getStableRoomNumber,
    GRID_PAGE_SIZE,
    LIST_PAGE_SIZE,
    SORT_OPTIONS,
    sortPatients,
    type SortOption,
} from "../utils/patient-records";

function getStatusTone(status: PatientStatus): BadgeTone {
    if (status === PATIENT_STATUS.ACTIVE) return "green";
    if (status === PATIENT_STATUS.CRITICAL) return "red";
    return "amber";
}

export default function Patients() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<"list" | "grid">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
    const [roomFilter, setRoomFilter] = useState("all");
    const [minAgeFilter, setMinAgeFilter] = useState("");
    const [maxAgeFilter, setMaxAgeFilter] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS.NONE);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const detailsRef = useRef<HTMLDivElement | null>(null);
    const patientSelectionRef = useRef<HTMLDivElement | null>(null);
    const closeTimerRef = useRef<number | null>(null);

    const debouncedSearch = useDebounce(search);
    const scopedPatients = useMemo(
        () => getScopedPatientsForEmail(user?.email),
        [user?.email],
    );

    const ageFilterError = getAgeFilterError(minAgeFilter, maxAgeFilter);
    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        roomFilter !== "all" ||
        minAgeFilter.trim() !== "" ||
        maxAgeFilter.trim() !== "" ||
        sortBy !== SORT_OPTIONS.NONE;

    const clearAllFilters = () => {
        setSearch("");
        setStatusFilter("all");
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

        const patient = scopedPatients.find((item) => item.id === patientId);
        if (!patient) return;

        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setSelected(patient);
        setSelectedVisit(null);
        requestAnimationFrame(() => setIsDetailsOpen(true));
    }, [scopedPatients, searchParams]);

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
        return filterPatients(scopedPatients, {
            ageFilterError,
            maxAgeFilter,
            minAgeFilter,
            roomFilter,
            search: debouncedSearch,
            statusFilter,
        });
    }, [ageFilterError, debouncedSearch, maxAgeFilter, minAgeFilter, roomFilter, scopedPatients, statusFilter]);

    const sortedPatients = useMemo(() => {
        return sortPatients(filtered, sortBy);
    }, [filtered, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, maxAgeFilter, minAgeFilter, roomFilter, sortBy, statusFilter, view]);

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
        <div className={`relative min-h-full ${THEME.SITE_BACKGROUND}`}>
            <div className="max-w-7xl mx-auto">
                <div className="my-2">
                    <h1 className="text-2xl font-semibold text-gray-950">Patients</h1>
                    <p className="text-sm text-gray-500">
                        Manage and monitor patient health records
                    </p>
                </div>

                <PatientFiltersToolbar
                    search={search}
                    statusFilter={statusFilter}
                    roomFilter={roomFilter}
                    minAgeFilter={minAgeFilter}
                    maxAgeFilter={maxAgeFilter}
                    sortBy={sortBy}
                    view={view}
                    patients={scopedPatients}
                    ageFilterError={ageFilterError}
                    hasActiveFilters={hasActiveFilters}
                    onSearchChange={setSearch}
                    onStatusFilterChange={setStatusFilter}
                    onRoomFilterChange={setRoomFilter}
                    onMinAgeFilterChange={setMinAgeFilter}
                    onMaxAgeFilterChange={setMaxAgeFilter}
                    onSortChange={setSortBy}
                    onViewChange={setView}
                    onClearFilters={clearAllFilters}
                />

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
                                        className={`cursor-pointer rounded-lg p-4 transition active:scale-[0.99] ${isSelected
                                            ? "bg-[#0b1f4d] text-white"
                                            : `bg-white text-gray-800 ${THEME.HOVER_BACKGROUND} hover:text-[#0b1f4d]`
                                            }`}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <Badge tone={getStatusTone(patient.status)} selected={isSelected}>
                                                {formatLabel(patient.status)}
                                            </Badge>
                                            <span className={`text-sm ${getSelectedTextClass(isSelected, "text-gray-500")}`}>
                                                {formatPatientDate(patient.lastVisitAt)}
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

                        <PatientPagination
                            currentPage={safeCurrentPage}
                            totalPages={totalPages}
                            summary={recordSummary}
                            onPageChange={setCurrentPage}
                        />
                        </>
                    ) : (
                        <DataTable
                            minWidthClassName="min-w-245"
                            maxHeightClassName="max-h-180"
                            columns={
                                <>
                                    <th className="px-3 py-3">Sl.no.</th>
                                    <th className="px-3 py-3">Admission Date</th>
                                    <th className="px-3 py-3">Patient</th>
                                    <th className="px-3 py-3">Diagnosis</th>
                                    <th className="px-3 py-3">Room Number</th>
                                    <th className="px-3 py-3">Assigned Doctor</th>
                                    <th className="px-3 py-3 text-center">Insurance</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="w-12 px-5 py-3" />
                                </>
                            }
                            footer={
                                <PatientPagination
                                    currentPage={safeCurrentPage}
                                    totalPages={totalPages}
                                    variant="compact"
                                    onPageChange={setCurrentPage}
                                />
                            }
                        >
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
                                            const isSelected = selected?.id === patient.id && isDetailsOpen;

                                            return (
                                                <tr
                                                    key={patient.id}
                                                    onClick={() => togglePatientSelection(patient)}
                                                    className={`cursor-pointer transition active:bg-gray-100 ${isSelected
                                                        ? "bg-[#0b1f4d] text-white hover:bg-[#0b1f4d]"
                                                        : THEME.HOVER_BACKGROUND
                                                        }`}
                                                >
                                                    <td className={`whitespace-nowrap px-3 py-3 ${getSelectedTextClass(isSelected, "text-gray-500")}`}>
                                                        {pageStartIndex + index + 1}
                                                    </td>
                                                    <td className={`whitespace-nowrap px-3 py-3 ${getSelectedTextClass(isSelected, "text-gray-900")}`}>
                                                        {formatPatientDate(patient.lastVisitAt)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${isSelected
                                                                ? "bg-white text-[#0b1f4d]"
                                                                : "bg-gray-100 text-gray-700"
                                                                }`}>
                                                                {getPatientInitials(patient)}
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
                                                                {getInitialsFromName(doctor.name)}
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
                                                        <Badge tone={getStatusTone(patient.status)} selected={isSelected}>
                                                            {formatLabel(patient.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className={`px-5 py-3 text-right text-xl leading-none ${getSelectedTextClass(isSelected, "text-gray-400")}`}>
                                                        <MoreVertical className="ml-auto h-4 w-4" />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                        </DataTable>
                    )}
                </div>

                {selected && (
                    <PatientDetailsPanel
                        patient={selected}
                        isOpen={isDetailsOpen}
                        panelRef={detailsRef}
                        onClose={closeDetails}
                        onVisitSelect={setSelectedVisit}
                    />
                )}

                {selectedVisit && (
                    <VisitDetailsModal
                        visit={selectedVisit}
                        onClose={() => setSelectedVisit(null)}
                    />
                )}
            </div>
        </div>
    );
}
