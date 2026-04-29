export const APPOINTMENT_STATUS = {
    SCHEDULED: "SCHEDULED",
    COMPLETED: "COMPLETED",
} as const;

export type AppointmentStatus =
    typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
