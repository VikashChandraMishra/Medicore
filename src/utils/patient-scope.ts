import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import { mockStaff } from "../data/staff";
import type { Patient } from "../types/patient";

export function getDoctorByEmail(email?: string | null) {
    return mockDoctors.find((doctor) => doctor.email === email);
}

export function getStaffByEmail(email?: string | null) {
    return mockStaff.find((staff) => staff.email === email);
}

export function getPatientsForDoctor(doctorId: string, patients: Patient[] = mockPatients) {
    return patients.filter(
        (patient) =>
            patient.visits.some((visit) => visit.doctorId === doctorId) ||
            patient.notes.some((note) => note.doctorId === doctorId),
    );
}

export function getScopedPatientsForEmail(email?: string | null) {
    const doctor = getDoctorByEmail(email);

    return doctor ? getPatientsForDoctor(doctor.id) : mockPatients;
}
