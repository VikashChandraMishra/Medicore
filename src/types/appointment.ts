import type { AppointmentStatus } from "../constants/appointment";

export interface Appointment {
    id: string;
    // uids
    patientId: string;
    doctorId: string;
    date: string;
    status: AppointmentStatus;
}
