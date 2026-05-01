import { PATIENT_STATUS, type PatientStatus } from "../constants/patient";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import type { Patient } from "../types/patient";
import { formatLabel } from "./format";
import { getFullName } from "./people";

export const LIST_PAGE_SIZE = 10;
export const GRID_PAGE_SIZE = 8;

export const SORT_OPTIONS = {
    NONE: "NONE",
    NAME_ASC: "NAME_ASC",
    AGE_ASC: "AGE_ASC",
    AGE_DESC: "AGE_DESC",
    LAST_VISIT_DESC: "LAST_VISIT_DESC",
    LAST_VISIT_ASC: "LAST_VISIT_ASC",
    ROOM_ASC: "ROOM_ASC",
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

export function getPrimaryCondition(patient: Patient) {
    return patient.chronicConditions[0] ?? "General care";
}

export function formatPatientDate(date?: Date) {
    if (!date) return "Not visited yet";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function getPatientInitials(patient: Patient) {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
}

export function getLatestVisit(patient: Patient) {
    return patient.visits[patient.visits.length - 1];
}

export function getDoctorName(doctorId?: string) {
    if (!doctorId) return "Unassigned";

    return mockDoctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
}

export function getDoctorMeta(patient: Patient) {
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

export function getStableRoomNumber(patient: Patient) {
    const patientIndex = mockPatients.findIndex((item) => item.id === patient.id);
    return getRoomNumber(patient, Math.max(0, patientIndex));
}

export function truncateText(value: string, maxLength = 96) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}...`;
}

export function getSelectedTextClass(isSelected: boolean, defaultClass: string) {
    return isSelected ? "text-white" : defaultClass;
}

export function getAgeFilterError(minAgeFilter: string, maxAgeFilter: string) {
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

type PatientFilterParams = {
    ageFilterError: string;
    maxAgeFilter: string;
    minAgeFilter: string;
    roomFilter: string;
    search: string;
    statusFilter: PatientStatus | "all";
};

export function filterPatients(patients: Patient[], params: PatientFilterParams) {
    return patients.filter((patient) => {
        const query = params.search.toLowerCase();
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
            params.statusFilter === "all" || patient.status === params.statusFilter;
        const matchesRoom =
            params.roomFilter === "all" || getStableRoomNumber(patient) === params.roomFilter;
        if (params.ageFilterError) return false;

        const minAge = Number(params.minAgeFilter);
        const maxAge = Number(params.maxAgeFilter);
        const matchesMinAge =
            !params.minAgeFilter.trim() || Number.isNaN(minAge) || patient.age >= minAge;
        const matchesMaxAge =
            !params.maxAgeFilter.trim() || Number.isNaN(maxAge) || patient.age <= maxAge;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesRoom &&
            matchesMinAge &&
            matchesMaxAge
        );
    });
}

export function sortPatients(patients: Patient[], sortBy: SortOption) {
    if (sortBy === SORT_OPTIONS.NONE) return patients;

    return [...patients].sort((a, b) => {
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
}
