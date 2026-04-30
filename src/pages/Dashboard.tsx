import {
    Activity,
    AlertTriangle,
    BellRing,
    CalendarClock,
    Clock3,
    FileWarning,
    HeartPulse,
    Stethoscope,
    UserCheck,
    Users,
} from "lucide-react";
import { Link } from "react-router";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { NOTE_TYPES, PATIENT_STATUS, VISIT_TYPES } from "../constants/patient";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import { notify } from "../utils/toast";
import type { Note, Patient, Visit } from "../types/patient";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LAST_SEVEN_DAYS_IN_MS = 7 * DAY_IN_MS;

type TimelineItem = {
    id: string;
    patient: Patient;
    createdAt: Date;
    type: "visit" | "note";
    title: string;
    detail: string;
    isUrgent: boolean;
};

type CriticalAlert = {
    id: string;
    patient: Patient;
    issue: string;
    lastVisitAt?: Date;
    source: string;
    severity: "critical" | "warning";
};

function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

function getLatestVisit(patient: Patient) {
    return [...patient.visits].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

function getLatestActivityDate() {
    const dates = mockPatients.flatMap((patient) => [
        patient.updatedAt,
        patient.createdAt,
        ...(patient.lastVisitAt ? [patient.lastVisitAt] : []),
        ...patient.visits.map((visit) => visit.createdAt),
        ...patient.notes.map((note) => note.createdAt),
    ]);

    return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function formatLabel(value: string) {
    return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatShortDate(date?: Date) {
    if (!date) return "No visits";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

function getDateKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function formatDateTime(date?: Date) {
    if (!date) return "No visits";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatRelativeTime(date: Date, now: Date) {
    const diff = Math.max(0, now.getTime() - date.getTime());
    const hours = Math.floor(diff / (60 * 60 * 1000));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
}

function getStatusClass(status: Patient["status"]) {
    if (status === PATIENT_STATUS.CRITICAL) return "bg-red-50 text-red-700 ring-red-100";
    if (status === PATIENT_STATUS.INACTIVE) return "bg-amber-50 text-amber-700 ring-amber-100";
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function getPatientDetailUrl(patient: Patient) {
    return `/patients?patientId=${encodeURIComponent(patient.id)}`;
}

function getDoctorName(doctorId: string) {
    return mockDoctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
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

function getCriticalAlerts() {
    const alerts = mockPatients.flatMap((patient) => {
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

function getDailyVisitTrend(visits: { visit: Visit }[], endDate: Date) {
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

export default function Dashboard() {
    const operationalNow = getLatestActivityDate();
    const lastSevenDaysStart = new Date(
        operationalNow.getTime() - LAST_SEVEN_DAYS_IN_MS,
    );

    const activePatients = mockPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.ACTIVE,
    ).length;
    const inactivePatients = mockPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.INACTIVE,
    ).length;
    const criticalPatients = mockPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.CRITICAL,
    ).length;
    const recentVisits = mockPatients.flatMap((patient) =>
        patient.visits
            .filter((visit) => visit.date >= lastSevenDaysStart)
            .map((visit) => ({ patient, visit })),
    );
    const allVisits = mockPatients.flatMap((patient) =>
        patient.visits.map((visit) => ({ patient, visit })),
    );
    const criticalAlerts = getCriticalAlerts();
    const activityFeed = mockPatients
        .flatMap((patient) => [
            ...patient.visits.map((visit, index) => createTimelineItemFromVisit(patient, visit, index)),
            ...patient.notes.map((note, index) => createTimelineItemFromNote(patient, note, index)),
        ])
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8);
    const patientSnapshot = [...mockPatients]
        .sort(
            (a, b) =>
                (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0),
        )
        .slice(0, 7);
    const dailyVisitTrend = getDailyVisitTrend(allVisits, operationalNow);

    const handleSimulateEmergencyAlert = async () => {
        const criticalPatient =
            mockPatients.find((patient) => patient.status === PATIENT_STATUS.CRITICAL) ??
            mockPatients[0];
        const latestVisit = getLatestVisit(criticalPatient);
        const title = "Emergency alert";
        const body = `${getFullName(criticalPatient)} - ${latestVisit?.diagnosis ?? "urgent review needed"}`;

        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            notify.error("Notifications are unavailable", {
                description: "This browser does not support service worker notifications.",
            });
            return;
        }

        const permission =
            Notification.permission === "granted"
                ? "granted"
                : await Notification.requestPermission();

        if (permission !== "granted") {
            notify.error("Notification permission blocked", {
                description: "Allow notifications to test the emergency alert.",
            });
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
            body,
            icon: "/android-chrome-192x192.png",
            badge: "/favicon-32x32.png",
            tag: "medicore-emergency-alert",
            data: {
                url: "/dashboard",
                patientId: criticalPatient.id,
            },
        });

        notify.success("Emergency alert simulated", {
            description: "The service worker displayed the notification.",
        });
    };

    return (
        <div className="min-h-full bg-gray-50 text-gray-800">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#0b1f4d]/8 px-3 py-1 text-sm font-medium text-[#0b1f4d]">
                        <Activity className="h-4 w-4" />
                        Live clinic operations
                    </p>
                    <h1 className="text-3xl font-semibold tracking-normal text-gray-950">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Snapshot refreshed through {formatDateTime(operationalNow)}
                    </p>
                </div>

                <button
                    onClick={handleSimulateEmergencyAlert}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0b1f4d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102a63] active:scale-[0.98]"
                >
                    <BellRing className="h-4 w-4" />
                    Simulate Emergency Alert
                </button>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="rounded-md bg-blue-50 p-2 text-[#0b1f4d]">
                            <Users className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-gray-400">Registry</span>
                    </div>
                    <p className="text-sm text-gray-500">Total Patients</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-950">
                        {mockPatients.length}
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-gray-400">Care state</span>
                    </div>
                    <p className="text-sm text-gray-500">Active vs Inactive</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-950">
                        {activePatients} / {inactivePatients}
                    </p>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="rounded-md bg-white p-2 text-red-700">
                            <HeartPulse className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-red-500">High attention</span>
                    </div>
                    <p className="text-sm text-red-600">Critical Patients</p>
                    <p className="mt-1 text-3xl font-semibold text-red-900">
                        {criticalPatients}
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="rounded-md bg-sky-50 p-2 text-sky-700">
                            <CalendarClock className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-gray-400">Last 7 days</span>
                    </div>
                    <p className="text-sm text-gray-500">Visits in Last 7 Days</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-950">
                        {recentVisits.length}
                    </p>
                </div>
            </section>

            <section className="mt-6">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-950">
                                Critical Alerts
                            </h2>
                            <p className="text-sm text-gray-500">
                                Critical status, emergency visits, and warning notes
                            </p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {criticalAlerts.map((alert) => (
                            <Link
                                key={alert.id}
                                to={getPatientDetailUrl(alert.patient)}
                                className="flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-gray-50 active:bg-gray-100"
                            >
                                <span
                                    className={`mt-1 rounded-md p-2 ${alert.severity === "critical"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-amber-50 text-amber-700"
                                        }`}
                                >
                                    {alert.severity === "critical" ? (
                                        <HeartPulse className="h-4 w-4" />
                                    ) : (
                                        <FileWarning className="h-4 w-4" />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold text-gray-950">
                                            {getFullName(alert.patient)}
                                        </p>
                                        <span className="text-xs font-medium text-gray-400">
                                            {formatDateTime(alert.lastVisitAt)}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                        {alert.issue}
                                    </p>
                                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                        {alert.source}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-6">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">
                            Visits in Last 7 Days
                        </h2>
                        <p className="text-sm text-gray-500">Daily encounter volume</p>
                    </div>
                    <div className="h-64 p-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={dailyVisitTrend}
                                margin={{ left: -18, right: 8, top: 8, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="visitVolume" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="5%" stopColor="#0b1f4d" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#0b1f4d" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#eef2f7" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: "#0b1f4d", strokeWidth: 1 }}
                                    contentStyle={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#0b1f4d"
                                    strokeWidth={3}
                                    fill="url(#visitVolume)"
                                    activeDot={{ r: 5, fill: "#0b1f4d" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">
                            Recent Activity
                        </h2>
                        <p className="text-sm text-gray-500">
                            Visits and notes sorted by created time
                        </p>
                    </div>
                    <div className="max-h-136 divide-y divide-gray-100 overflow-y-auto">
                        {activityFeed.map((item) => (
                            <div key={item.id} className="flex gap-3 px-5 py-4">
                                <span
                                    className={`mt-1 rounded-md p-2 ${item.isUrgent
                                        ? "bg-red-50 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {item.type === "visit" ? (
                                        <Stethoscope className="h-4 w-4" />
                                    ) : (
                                        <Clock3 className="h-4 w-4" />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-medium text-gray-950">{item.title}</p>
                                        <span className="shrink-0 text-xs text-gray-400">
                                            {formatRelativeTime(item.createdAt, operationalNow)}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                        {item.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-950">
                                Patient Snapshot
                            </h2>
                            <p className="text-sm text-gray-500">
                                Recent patients with status and condition count
                            </p>
                        </div>
                        <Link
                            to="/patients"
                            className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="max-h-126 overflow-auto">
                        <table className="w-full min-w-160 text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Last Visit</th>
                                    <th className="px-5 py-3 text-right">Conditions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {patientSnapshot.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <Link
                                                to={getPatientDetailUrl(patient)}
                                                className="cursor-pointer font-medium text-gray-950 transition hover:text-[#0b1f4d] active:scale-[0.98]"
                                            >
                                                {getFullName(patient)}
                                            </Link>
                                            <p className="text-xs text-gray-500">
                                                {patient.address.city}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClass(patient.status)}`}
                                            >
                                                {formatLabel(patient.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {formatShortDate(patient.lastVisitAt)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-gray-950">
                                            {patient.chronicConditions.length}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
