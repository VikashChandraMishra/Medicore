import type { Patient } from "../types/patient";
import type { User } from "../types/user";

export function getDoctorByEmail(email: string | null | undefined, doctors: User[]) {
    return doctors.find((doctor) => doctor.email === email);
}

export function getStaffByEmail(email: string | null | undefined, staff: User[]) {
    return staff.find((staffMember) => staffMember.email === email);
}

export function getPatientsForDoctor(doctorId: string, patients: Patient[]) {
    return patients.filter(
        (patient) =>
            patient.visits.some((visit) => visit.doctorId === doctorId) ||
            patient.notes.some((note) => note.doctorId === doctorId),
    );
}

export function getScopedPatientsForEmail(
    email: string | null | undefined,
    patients: Patient[],
    doctors: User[],
) {
    const doctor = getDoctorByEmail(email, doctors);

    return doctor ? getPatientsForDoctor(doctor.id, patients) : patients;
}
