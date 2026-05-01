import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import type { Patient } from "../types/patient";

export function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

export function getDoctorName(doctorId: string) {
    return mockDoctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
}

export function getPatientName(patientId: string) {
    const patient = mockPatients.find((item) => item.id === patientId);

    return patient ? getFullName(patient) : "Unknown patient";
}
