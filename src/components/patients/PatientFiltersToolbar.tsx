import { LayoutGrid, List, Search } from "lucide-react";
import type { PatientStatus } from "../../constants/patient";
import { PATIENT_STATUS } from "../../constants/patient";
import { THEME } from "../../constants/theme";
import type { Patient } from "../../types/patient";
import { getStableRoomNumber, SORT_OPTIONS, type SortOption } from "../../utils/patient-records";
import Input from "../ui/Input";
import Select from "../ui/Select";

type PatientFiltersToolbarProps = {
    search: string;
    statusFilter: PatientStatus | "all";
    roomFilter: string;
    minAgeFilter: string;
    maxAgeFilter: string;
    sortBy: SortOption;
    view: "list" | "grid";
    patients: Patient[];
    ageFilterError: string;
    hasActiveFilters: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: PatientStatus | "all") => void;
    onRoomFilterChange: (value: string) => void;
    onMinAgeFilterChange: (value: string) => void;
    onMaxAgeFilterChange: (value: string) => void;
    onSortChange: (value: SortOption) => void;
    onViewChange: (value: "list" | "grid") => void;
    onClearFilters: () => void;
};

const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: PATIENT_STATUS.ACTIVE },
    { label: "Inactive", value: PATIENT_STATUS.INACTIVE },
    { label: "Critical", value: PATIENT_STATUS.CRITICAL },
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

export default function PatientFiltersToolbar({
    search,
    statusFilter,
    roomFilter,
    minAgeFilter,
    maxAgeFilter,
    sortBy,
    view,
    patients,
    ageFilterError,
    hasActiveFilters,
    onSearchChange,
    onStatusFilterChange,
    onRoomFilterChange,
    onMinAgeFilterChange,
    onMaxAgeFilterChange,
    onSortChange,
    onViewChange,
    onClearFilters,
}: PatientFiltersToolbarProps) {
    const roomSelectOptions = [
        { label: "All Rooms", value: "all" },
        ...patients.map((patient) => {
            const room = getStableRoomNumber(patient);

            return {
                label: room,
                value: room,
            };
        }),
    ];

    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search patients..."
                    className="w-42 [&_input]:h-9 [&_input]:rounded-lg"
                    leftIcon={<Search className="h-4 w-4" />}
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />

                <Select
                    className="w-28 [&_button]:h-9 [&_button]:rounded-lg"
                    value={statusFilter}
                    options={statusOptions}
                    onValueChange={(value) =>
                        onStatusFilterChange(value as PatientStatus | "all")
                    }
                    ariaLabel="Filter by status"
                />

                <Select
                    className="w-32 [&_button]:h-9 [&_button]:rounded-lg"
                    value={roomFilter}
                    options={roomSelectOptions}
                    onValueChange={onRoomFilterChange}
                    ariaLabel="Filter by room number"
                />

                <Input
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    value={minAgeFilter}
                    onChange={(event) => onMinAgeFilterChange(event.target.value)}
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
                    onChange={(event) => onMaxAgeFilterChange(event.target.value)}
                    placeholder="Max age"
                    className="w-28 [&_input]:h-9 [&_input]:rounded-lg"
                    inputClassName={ageFilterError ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/10" : ""}
                />

                <Select
                    className="w-39 [&_button]:h-9 [&_button]:rounded-lg"
                    value={sortBy}
                    options={sortOptions}
                    onValueChange={(value) => onSortChange(value as SortOption)}
                    ariaLabel="Sort patients"
                />

                <button
                    type="button"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                    className={`h-9 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                >
                    Clear all
                </button>

                <div className="flex overflow-hidden rounded-md border-2 border-[#0b1f4d] divide-x-2 divide-[#0b1f4d]">
                    <button
                        aria-label="Grid view"
                        title="Grid view"
                        className={`grid h-9 w-10 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "grid" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                        onClick={() => onViewChange("grid")}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        aria-label="List view"
                        title="List view"
                        className={`grid h-9 w-10 cursor-pointer place-items-center transition active:scale-[0.95] ${view === "list" ? "bg-[#0b1f4d] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                        onClick={() => onViewChange("list")}
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
    );
}
