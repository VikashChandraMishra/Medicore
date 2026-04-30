import type { AppointmentStatus } from "../constants/appointment";

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    status: AppointmentStatus;
}
