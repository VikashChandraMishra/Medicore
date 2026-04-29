export const GENDERS = {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER",
} as const;

export type Gender = typeof GENDERS[keyof typeof GENDERS];

export const PATIENT_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    CRITICAL: "CRITICAL",
} as const;

export type PatientStatus = typeof PATIENT_STATUS[keyof typeof PATIENT_STATUS];

export const VISIT_TYPES = {
    CONSULTATION: "CONSULTATION",
    FOLLOW_UP: "FOLLOW UP",
    EMERGENCY: "EMERGENCY",
    ROUTINE: "ROUTINE",
} as const;

export type VisitType = typeof VISIT_TYPES[keyof typeof VISIT_TYPES];

export const NOTE_TYPES = {
    GENERAL: "GENERAL",
    WARNING: "WARNING",
    FOLLOW_UP: "FOLLOW UP",
} as const;

export type NoteType = typeof NOTE_TYPES[keyof typeof NOTE_TYPES];
