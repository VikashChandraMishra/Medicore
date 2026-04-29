export const USER_ROLES = {
    ADMIN: "ADMIN",
    DOCTOR: "DOCTOR",
    STAFF: "STAFF",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export const DEPARTMENTS = {
    OPERATIONS: "Operations",
    CARDIOLOGY: "Cardiology",
    GENERAL_MEDICINE: "General Medicine",
    PEDIATRICS: "Pediatrics",
    FRONT_DESK: "Front Desk",
    BILLING: "Billing",
    NURSING: "Nursing",
    LABORATORY: "Laboratory",
    PHARMACY: "Pharmacy",
} as const;

export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];
