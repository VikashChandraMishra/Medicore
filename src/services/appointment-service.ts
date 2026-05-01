import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../config/firebase-config";
import { COLLECTIONS } from "../constants/collections";
import type { Appointment } from "../types/appointment";

function isAppointment(value: unknown): value is Appointment {
    if (!value || typeof value !== "object") return false;

    const appointment = value as Record<string, unknown>;

    return (
        typeof appointment.patientId === "string" &&
        typeof appointment.doctorId === "string" &&
        typeof appointment.appointmentDate === "string"
    );
}

export function subscribeToAppointments(
    onChange: (appointments: Appointment[]) => void,
    onError: () => void,
) {
    return onSnapshot(
        collection(db, COLLECTIONS.APPOINTMENTS),
        (snapshot) => {
            const appointments = snapshot.docs
                .map((appointmentDoc) => appointmentDoc.data())
                .filter(isAppointment)
                .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));

            onChange(appointments);
        },
        onError,
    );
}

export function saveAppointment(appointment: Appointment) {
    return setDoc(
        doc(db, COLLECTIONS.APPOINTMENTS, appointment.appointmentDate),
        appointment,
    );
}

export function deleteAppointment(appointmentDate: string) {
    return deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentDate));
}

export function getAppointmentNotificationKey(appointment: Appointment) {
    return `${appointment.doctorId}:${appointment.patientId}:${appointment.appointmentDate}`;
}
