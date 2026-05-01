import type { Patient } from "../types/patient";
import type { User } from "../types/user";

export function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

export function getDoctorName(doctorId: string, doctors: User[]) {
    return doctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
}

export function getPatientName(patientId: string, patients: Patient[]) {
    const patient = patients.find((item) => item.id === patientId);

    return patient ? getFullName(patient) : "Unknown patient";
}
