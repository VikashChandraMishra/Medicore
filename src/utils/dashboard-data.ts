import { NOTE_TYPES, PATIENT_STATUS, VISIT_TYPES } from "../constants/patient";
import type { Note, Patient, Visit } from "../types/patient";
import { formatShortDate, getDateKey } from "./date";
import { formatLabel } from "./format";
import { getDoctorName, getFullName } from "./people";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const LAST_SEVEN_DAYS_IN_MS = 7 * DAY_IN_MS;

export type TimelineItem = {
    id: string;
    patient: Patient;
    createdAt: Date;
    type: "visit" | "note";
    title: string;
    detail: string;
    isUrgent: boolean;
};

export type CriticalAlert = {
    id: string;
    patient: Patient;
    issue: string;
    lastVisitAt?: Date;
    source: string;
    severity: "critical" | "warning";
};

export function getLatestVisit(patient: Patient) {
    return [...patient.visits].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

export function getLatestActivityDate(patients: Patient[]) {
    const dates = patients.flatMap((patient) => [
        patient.updatedAt,
        patient.createdAt,
        ...(patient.lastVisitAt ? [patient.lastVisitAt] : []),
        ...patient.visits.map((visit) => visit.createdAt),
        ...patient.notes.map((note) => note.createdAt),
    ]);

    if (dates.length === 0) return new Date();

    return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function createTimelineItemFromVisit(patient: Patient, visit: Visit, index: number): TimelineItem {
    const doctorName = getDoctorName(visit.doctorId);

    return {
        id: `${patient.id}-visit-${index}`,
        patient,
        createdAt: visit.createdAt,
        type: "visit",
        title: `${getFullName(patient)} had ${formatLabel(visit.type)} visit`,
        detail: `${doctorName}${visit.diagnosis ? ` - ${visit.diagnosis}` : ""}`,
        isUrgent: visit.type === VISIT_TYPES.EMERGENCY,
    };
}

function createTimelineItemFromNote(patient: Patient, note: Note, index: number): TimelineItem {
    const doctorName = getDoctorName(note.doctorId);

    return {
        id: `${patient.id}-note-${index}`,
        patient,
        createdAt: note.createdAt,
        type: "note",
        title: `Note added by ${doctorName}`,
        detail: `${getFullName(patient)} - ${note.content}`,
        isUrgent: note.type === NOTE_TYPES.WARNING,
    };
}

export function getActivityFeed(patients: Patient[]) {
    return patients
        .flatMap((patient) => [
            ...patient.visits.map((visit, index) => createTimelineItemFromVisit(patient, visit, index)),
            ...patient.notes.map((note, index) => createTimelineItemFromNote(patient, note, index)),
        ])
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8);
}

export function getCriticalAlerts(patients: Patient[]) {
    const alerts = patients.flatMap((patient) => {
        const latestVisit = getLatestVisit(patient);
        const patientAlerts: CriticalAlert[] = [];

        if (patient.status === PATIENT_STATUS.CRITICAL) {
            patientAlerts.push({
                id: `${patient.id}-status`,
                patient,
                issue:
                    latestVisit?.diagnosis ??
                    patient.chronicConditions[0] ??
                    "Critical patient status",
                lastVisitAt: latestVisit?.date,
                source: "Critical status",
                severity: "critical",
            });
        }

        patient.visits
            .filter((visit) => visit.type === VISIT_TYPES.EMERGENCY)
            .forEach((visit, index) => {
                patientAlerts.push({
                    id: `${patient.id}-emergency-${index}`,
                    patient,
                    issue: visit.diagnosis ?? visit.symptoms[0] ?? "Emergency visit",
                    lastVisitAt: visit.date,
                    source: "Emergency visit",
                    severity: "critical",
                });
            });

        patient.notes
            .filter((note) => note.type === NOTE_TYPES.WARNING)
            .forEach((note, index) => {
                patientAlerts.push({
                    id: `${patient.id}-warning-${index}`,
                    patient,
                    issue: note.content,
                    lastVisitAt: latestVisit?.date,
                    source: `Warning by ${getDoctorName(note.doctorId)}`,
                    severity: "warning",
                });
            });

        return patientAlerts;
    });

    return alerts
        .sort(
            (a, b) =>
                (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0),
        )
        .slice(0, 6);
}

export function getDailyVisitTrend(visits: { visit: Visit }[], endDate: Date) {
    return Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(endDate);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));

        return {
            date: formatShortDate(date),
            visits: visits.filter(({ visit }) => getDateKey(visit.date) === getDateKey(date))
                .length,
        };
    });
}
