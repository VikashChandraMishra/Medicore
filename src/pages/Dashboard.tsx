import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import {
    Activity,
    AlertTriangle,
    CalendarClock,
    Clock3,
    FileWarning,
    HeartPulse,
    Stethoscope,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import UserDirectory from "../components/dashboard/UserDirectory";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import CloseButton from "../components/ui/CloseButton";
import DataTable from "../components/ui/DataTable";
import Select from "../components/ui/Select";
import { db } from "../config/firebase-config";
import { COLLECTIONS } from "../constants/collections";
import { NOTE_TYPES, PATIENT_STATUS, VISIT_TYPES } from "../constants/patient";
import { THEME } from "../constants/theme";
import { USER_STATUS } from "../constants/user";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import { isAdminEmail } from "../data/users";
import useAuth from "../hooks/use-auth";
import type { Appointment } from "../types/appointment";
import type { Note, Patient, Visit } from "../types/patient";
import { getDoctorByEmail, getScopedPatientsForEmail, getStaffByEmail } from "../utils/patient-scope";
import { notify } from "../utils/toast";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LAST_SEVEN_DAYS_IN_MS = 7 * DAY_IN_MS;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

type DashboardTab = "alerts" | "visits" | "activity" | "appointments" | "patients" | "users";

type CalendarDay = {
    date: Date;
    isCurrentMonth: boolean;
    isPast: boolean;
    isToday: boolean;
};

function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

function getLatestVisit(patient: Patient) {
    return [...patient.visits].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

function getLatestActivityDate(patients: Patient[]) {
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

function formatMonthYear(date: Date) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatLongDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getMonthCalendarDays(date: Date) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((monthEnd.getDate() + monthStart.getDay()) / 7) * 7;

    return Array.from({ length: totalDays }).map((_, index): CalendarDay => {
        const day = new Date(calendarStart);
        day.setDate(calendarStart.getDate() + index);

        const normalizedDay = new Date(day);
        normalizedDay.setHours(0, 0, 0, 0);

        return {
            date: day,
            isCurrentMonth: day.getMonth() === date.getMonth(),
            isPast: normalizedDay < today,
            isToday: normalizedDay.getTime() === today.getTime(),
        };
    });
}

function isAppointment(value: unknown): value is Appointment {
    if (!value || typeof value !== "object") return false;

    const appointment = value as Record<string, unknown>;

    return (
        typeof appointment.patientId === "string" &&
        typeof appointment.doctorId === "string" &&
        typeof appointment.appointmentDate === "string"
    );
}

function getNotificationStatus(permission: NotificationPermission) {
    if (permission === "granted") return { label: "Notifications enabled", tone: "green" as const };
    if (permission === "denied") return { label: "Notifications blocked", tone: "red" as const };
    return { label: "Notifications not enabled", tone: "amber" as const };
}

async function showServiceWorkerNotification(title: string, options: NotificationOptions) {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service worker notifications are unavailable.");
    }

    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
        ...options,
        requireInteraction: true,
    });
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

function getStatusTone(status: Patient["status"]): BadgeTone {
    if (status === PATIENT_STATUS.CRITICAL) return "red";
    if (status === PATIENT_STATUS.INACTIVE) return "amber";
    return "green";
}

function getPatientDetailUrl(patient: Patient) {
    return `/patients?patientId=${encodeURIComponent(patient.id)}`;
}

function getDoctorName(doctorId: string) {
    return mockDoctors.find((doctor) => doctor.id === doctorId)?.displayName ?? "Unassigned";
}

function getPatientName(patientId: string) {
    const patient = mockPatients.find((item) => item.id === patientId);

    return patient ? getFullName(patient) : "Unknown patient";
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

function getCriticalAlerts(patients: Patient[]) {
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<DashboardTab>("alerts");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointmentDateKey, setSelectedAppointmentDateKey] = useState<string | null>(null);
    const [appointmentPatientId, setAppointmentPatientId] = useState("");
    const [appointmentDoctorId, setAppointmentDoctorId] = useState("");
    const [isEditingExistingAppointment, setIsEditingExistingAppointment] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
        "Notification" in window ? Notification.permission : "denied",
    );
    const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
    const notifiedAppointmentIdsRef = useRef<Set<string>>(new Set());
    const showUserDirectory = isAdminEmail(user?.email);
    const currentDoctor = getDoctorByEmail(user?.email);
    const currentStaff = getStaffByEmail(user?.email);
    const currentProfile = currentDoctor ?? currentStaff;
    const isStaffDashboard = Boolean(currentStaff);
    const scopedPatients = getScopedPatientsForEmail(user?.email);
    const operationalNow = getLatestActivityDate(scopedPatients);
    const lastSevenDaysStart = new Date(
        operationalNow.getTime() - LAST_SEVEN_DAYS_IN_MS,
    );

    useEffect(() => {
        if (!showUserDirectory && activeTab === "users") {
            setActiveTab("alerts");
        }

        if (!currentDoctor && !currentStaff && activeTab === "appointments") {
            setActiveTab("alerts");
        }

        if (isStaffDashboard && activeTab !== "visits" && activeTab !== "appointments") {
            setActiveTab("visits");
        }
    }, [activeTab, currentDoctor, currentStaff, isStaffDashboard, showUserDirectory]);

    useEffect(() => {
        return onSnapshot(
            collection(db, COLLECTIONS.APPOINTMENTS),
            (snapshot) => {
                const nextAppointments = snapshot.docs
                    .map((appointmentDoc) => appointmentDoc.data())
                    .filter(isAppointment)
                    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));

                setAppointments(nextAppointments);
            },
            () => {
                notify.error("Could not load appointments", {
                    description: "Check the Firestore connection and permissions.",
                });
            },
        );
    }, []);

    useEffect(() => {
        if (!currentDoctor || !("Notification" in window)) {
            return;
        }

        setNotificationPermission(Notification.permission);

        if (Notification.permission !== "default") {
            return;
        }

        Notification.requestPermission()
            .then((permission) => setNotificationPermission(permission))
            .catch(() => setNotificationPermission(Notification.permission));
    }, [currentDoctor]);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) {
            setIsServiceWorkerReady(false);
            return;
        }

        let isMounted = true;

        navigator.serviceWorker.ready
            .then(() => {
                if (isMounted) {
                    setIsServiceWorkerReady(true);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsServiceWorkerReady(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (currentDoctor && !("serviceWorker" in navigator)) {
            notify.error("Notifications are unavailable", {
                description: "This browser does not support service worker notifications.",
            });
            return;
        }

        if (
            !currentDoctor ||
            !("serviceWorker" in navigator) ||
            notificationPermission !== "granted"
        ) {
            return;
        }

        const doctorAppointments = appointments.filter(
            (appointment) => appointment.doctorId === currentDoctor.id,
        );
        const pendingNotifications = doctorAppointments.filter(
            (appointment) =>
                !notifiedAppointmentIdsRef.current.has(
                    `${appointment.doctorId}:${appointment.patientId}:${appointment.appointmentDate}`,
                ),
        );

        if (pendingNotifications.length === 0) return;

        const showAppointmentNotifications = async () => {
            await Promise.all(
                pendingNotifications.map((appointment) =>
                    showServiceWorkerNotification("New appointment scheduled", {
                        body: `${getPatientName(appointment.patientId)} on ${formatLongDate(new Date(`${appointment.appointmentDate}T00:00:00`))}`,
                        icon: "/android-chrome-192x192.png",
                        badge: "/favicon-32x32.png",
                        tag: `medicore-appointment-${appointment.doctorId}-${appointment.patientId}-${appointment.appointmentDate}`,
                        data: {
                            url: "/dashboard",
                            appointmentDate: appointment.appointmentDate,
                        },
                    }),
                ),
            );

            pendingNotifications.forEach((appointment) => {
                notifiedAppointmentIdsRef.current.add(
                    `${appointment.doctorId}:${appointment.patientId}:${appointment.appointmentDate}`,
                );
            });
        };

        showAppointmentNotifications().catch(() => {
            notify.error("Could not show appointment notification", {
                description: "Check browser notification and service worker permissions.",
            });
        });
    }, [appointments, currentDoctor, notificationPermission]);

    const activePatients = scopedPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.ACTIVE,
    ).length;
    const inactivePatients = scopedPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.INACTIVE,
    ).length;
    const criticalPatients = scopedPatients.filter(
        (patient) => patient.status === PATIENT_STATUS.CRITICAL,
    ).length;
    const recentVisits = scopedPatients.flatMap((patient) =>
        patient.visits
            .filter((visit) => visit.date >= lastSevenDaysStart)
            .map((visit) => ({ patient, visit })),
    );
    const allVisits = scopedPatients.flatMap((patient) =>
        patient.visits.map((visit) => ({ patient, visit })),
    );
    const criticalAlerts = getCriticalAlerts(scopedPatients);
    const activityFeed = scopedPatients
        .flatMap((patient) => [
            ...patient.visits.map((visit, index) => createTimelineItemFromVisit(patient, visit, index)),
            ...patient.notes.map((note, index) => createTimelineItemFromNote(patient, note, index)),
        ])
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 8);
    const patientSnapshot = [...scopedPatients]
        .sort(
            (a, b) =>
                (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0),
        )
        .slice(0, 7);
    const patientSnapshotTotalPages = 1;
    const currentMonth = new Date();
    const calendarDays = getMonthCalendarDays(currentMonth);
    const dailyVisitTrend = getDailyVisitTrend(allVisits, operationalNow);
    const visibleAppointments = currentDoctor
        ? appointments.filter((appointment) => appointment.doctorId === currentDoctor.id)
        : appointments;
    const appointmentsByDate = new Map(
        visibleAppointments.map((appointment) => [appointment.appointmentDate, appointment]),
    );
    const selectedAppointment = selectedAppointmentDateKey
        ? appointments.find((appointment) => appointment.appointmentDate === selectedAppointmentDateKey)
        : undefined;
    const selectedAppointmentDate = selectedAppointmentDateKey
        ? new Date(`${selectedAppointmentDateKey}T00:00:00`)
        : null;
    const patientOptions = scopedPatients.map((patient) => ({
        label: getFullName(patient),
        value: patient.id,
    }));
    const doctorOptions = mockDoctors.map((doctor) => ({
        label: doctor.displayName,
        value: doctor.id,
    }));
    const notificationStatus = getNotificationStatus(notificationPermission);
    const visibleActiveTab =
        isStaffDashboard && activeTab !== "visits" && activeTab !== "appointments"
            ? "visits"
            : activeTab;
    const dashboardTabs: Array<{ label: string; value: DashboardTab }> = [
        ...(isStaffDashboard ? [] : [{ label: "Critical Alerts", value: "alerts" as DashboardTab }]),
        { label: "Visits in Last 7 Days", value: "visits" },
        ...(isStaffDashboard ? [] : [{ label: "Recent Activity", value: "activity" as DashboardTab }]),
        ...(currentDoctor ? [{ label: "Upcoming Appointments", value: "appointments" as DashboardTab }] : []),
        ...(currentStaff ? [{ label: "Schedule Appointments", value: "appointments" as DashboardTab }] : []),
        ...(isStaffDashboard ? [] : [{ label: "Patient Snapshot", value: "patients" as DashboardTab }]),
        ...(showUserDirectory ? [{ label: "Users", value: "users" as DashboardTab }] : []),
    ];
    const dashboardMetrics = isStaffDashboard
        ? [
            {
                label: "Visits in Last 7 Days",
                value: recentVisits.length,
                icon: CalendarClock,
            },
        ]
        : [
            {
                label: "Total Patients",
                value: scopedPatients.length,
                icon: Users,
            },
            {
                label: "Active vs Inactive",
                value: `${activePatients} / ${inactivePatients}`,
                icon: UserCheck,
            },
            {
                label: "Critical Patients",
                value: criticalPatients,
                icon: HeartPulse,
            },
            {
                label: "Visits in Last 7 Days",
                value: recentVisits.length,
                icon: CalendarClock,
            },
        ];

    const handleEnableNotifications = async () => {
        if (!("Notification" in window)) {
            notify.error("Notifications are unavailable", {
                description: "This browser does not support notifications.",
            });
            setNotificationPermission("denied");
            return;
        }

        if (!("serviceWorker" in navigator)) {
            notify.error("Notifications are unavailable", {
                description: "This browser does not support service worker notifications.",
            });
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
            notify.success("Notifications enabled");
            return;
        }

        notify.error("Notifications are not enabled", {
            description:
                permission === "denied"
                    ? "Open browser site settings to allow notifications for this app."
                    : "Allow notifications to receive appointment alerts.",
        });
    };

    const handleSendTestNotification = async () => {
        if (notificationPermission !== "granted") {
            await handleEnableNotifications();
        }

        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        try {
            await showServiceWorkerNotification("Medicore notifications are working", {
                body: "Appointment alerts will appear here.",
                icon: "/android-chrome-192x192.png",
                badge: "/favicon-32x32.png",
                tag: `medicore-test-${Date.now()}`,
                data: {
                    url: "/dashboard",
                },
            });
            notify.success("Test notification sent");
        } catch {
            notify.error("Could not send test notification", {
                description: "The service worker may not be registered or browser notifications may be blocked.",
            });
        }
    };

    const openAppointmentModal = (dateKey: string) => {
        if (!currentStaff) return;

        const appointment = appointments.find((item) => item.appointmentDate === dateKey);

        setSelectedAppointmentDateKey(dateKey);
        setAppointmentPatientId(appointment?.patientId ?? patientOptions[0]?.value ?? "");
        setAppointmentDoctorId(appointment?.doctorId ?? doctorOptions[0]?.value ?? "");
        setIsEditingExistingAppointment(Boolean(appointment));
    };

    const closeAppointmentModal = () => {
        setSelectedAppointmentDateKey(null);
        setAppointmentPatientId("");
        setAppointmentDoctorId("");
        setIsEditingExistingAppointment(false);
    };

    const saveAppointment = async () => {
        if (!selectedAppointmentDateKey) return;

        const patient = scopedPatients.find((item) => item.id === appointmentPatientId);
        const doctor = mockDoctors.find((item) => item.id === appointmentDoctorId);

        if (!patient || !doctor) {
            notify.error("Select a patient and doctor");
            return;
        }

        const nextAppointment: Appointment = {
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentDate: selectedAppointmentDateKey,
        };

        try {
            await setDoc(
                doc(db, COLLECTIONS.APPOINTMENTS, selectedAppointmentDateKey),
                nextAppointment,
            );
            closeAppointmentModal();
        } catch {
            notify.error("Could not schedule appointment", {
                description: "Check the Firestore connection and permissions.",
            });
        }
    };

    const removeAppointment = async (dateKey: string) => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, dateKey));

            if (selectedAppointmentDateKey === dateKey) {
                closeAppointmentModal();
            }
        } catch {
            notify.error("Could not remove appointment", {
                description: "Check the Firestore connection and permissions.",
            });
        }
    };

    return (
        <div className={`min-h-full ${THEME.SITE_BACKGROUND} text-gray-800`}>
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
            </div>

            {currentProfile && (
                <section className="mb-6 rounded-lg bg-white p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                {currentStaff ? "Staff profile" : "Doctor profile"}
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-gray-950">
                                {currentProfile.displayName}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">{currentProfile.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge tone="accent">{currentProfile.id}</Badge>
                            <Badge tone={currentProfile.status === USER_STATUS.ACTIVE ? "green" : "amber"}>
                                {formatLabel(currentProfile.status)}
                            </Badge>
                        </div>
                    </div>
                    {currentDoctor && (
                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Appointment alerts
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <Badge tone={notificationStatus.tone}>
                                        {notificationStatus.label}
                                    </Badge>
                                    <Badge tone={isServiceWorkerReady ? "green" : "amber"}>
                                        {isServiceWorkerReady ? "Service worker ready" : "Service worker not ready"}
                                    </Badge>
                                    {notificationPermission === "denied" && (
                                        <span className="text-xs text-gray-500">
                                            Enable notifications in browser site settings.
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                            {notificationPermission !== "granted" && (
                                <button
                                    type="button"
                                    onClick={handleEnableNotifications}
                                    disabled={notificationPermission === "denied"}
                                    className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    Enable notifications
                                </button>
                            )}
                                <button
                                    type="button"
                                    onClick={handleSendTestNotification}
                                    className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98]`}
                                >
                                    Send test notification
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {dashboardMetrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div key={metric.label} className="rounded-xl bg-white p-3">
                            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <Icon className="h-3.5 w-3.5" />
                                {metric.label}
                            </p>
                            <p className="font-medium text-gray-800">{metric.value}</p>
                        </div>
                    );
                })}
            </section>

            <section className="mt-6 overflow-hidden rounded-lg bg-white">
                <div className="flex gap-1 overflow-x-auto border-b border-gray-100 p-2" role="tablist" aria-label="Dashboard sections">
                    {dashboardTabs.map((tab) => {
                        const isActive = visibleActiveTab === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.value)}
                                className={`shrink-0 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${isActive
                                    ? "bg-[#0b1f4d] text-white"
                                    : `text-gray-600 ${THEME.HOVER_BACKGROUND} hover:text-[#0b1f4d]`
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {visibleActiveTab === "alerts" && !isStaffDashboard && (
                    <>
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950">Critical Alerts</h2>
                                <p className="text-sm text-gray-500">Critical status, emergency visits, and warning notes</p>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {criticalAlerts.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-gray-500">
                                    No critical alerts in this patient scope.
                                </p>
                            ) : (
                                criticalAlerts.map((alert) => (
                                    <Link
                                        key={alert.id}
                                        to={getPatientDetailUrl(alert.patient)}
                                        className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition ${THEME.HOVER_BACKGROUND} active:bg-gray-100`}
                                    >
                                        <span className={`mt-1 rounded-md p-2 ${alert.severity === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {alert.severity === "critical" ? <HeartPulse className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-semibold text-gray-950">{getFullName(alert.patient)}</p>
                                                <span className="text-xs font-medium text-gray-400">{formatDateTime(alert.lastVisitAt)}</span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{alert.issue}</p>
                                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">{alert.source}</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </>
                )}

                {visibleActiveTab === "visits" && (
                    <>
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-lg font-semibold text-gray-950">Visits in Last 7 Days</h2>
                            <p className="text-sm text-gray-500">Daily encounter volume</p>
                        </div>
                        <div className="h-64 p-5">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyVisitTrend} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="visitVolume" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="5%" stopColor="#0b1f4d" stopOpacity={0.28} />
                                            <stop offset="95%" stopColor="#0b1f4d" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#eef2f7" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                                    <Tooltip cursor={{ stroke: "#0b1f4d", strokeWidth: 1 }} contentStyle={{ border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                                    <Area type="monotone" dataKey="visits" stroke="#0b1f4d" strokeWidth={3} fill="url(#visitVolume)" activeDot={{ r: 5, fill: "#0b1f4d" }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {visibleActiveTab === "activity" && !isStaffDashboard && (
                    <>
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-lg font-semibold text-gray-950">Recent Activity</h2>
                            <p className="text-sm text-gray-500">Visits and notes sorted by created time</p>
                        </div>
                        <div className="max-h-136 divide-y divide-gray-100 overflow-y-auto">
                            {activityFeed.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-gray-500">
                                    No recent activity in this patient scope.
                                </p>
                            ) : (
                                activityFeed.map((item) => (
                                    <div key={item.id} className="flex gap-3 px-5 py-4">
                                        <span className={`mt-1 rounded-md p-2 ${item.isUrgent ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                                            {item.type === "visit" ? <Stethoscope className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-medium text-gray-950">{item.title}</p>
                                                <span className="shrink-0 text-xs text-gray-400">{formatRelativeTime(item.createdAt, operationalNow)}</span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.detail}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {visibleActiveTab === "appointments" && (currentDoctor || currentStaff) && (
                    <>
                        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950">
                                    {currentStaff ? "Schedule Appointments" : "Upcoming Appointments"}
                                </h2>
                                <p className="text-sm text-gray-500">{formatMonthYear(currentMonth)}</p>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <div className="overflow-hidden rounded-lg bg-white">
                                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                    {WEEKDAYS.map((weekday) => (
                                        <div key={weekday} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            {weekday}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7">
                                    {calendarDays.map((day) => {
                                        const dayLabel = day.date.getDate();
                                        const dayKey = getDateKey(day.date);
                                        const appointment = appointmentsByDate.get(dayKey);
                                        const canSchedule = Boolean(currentStaff && day.isCurrentMonth);

                                        return (
                                            <div
                                                key={dayKey}
                                                role={canSchedule ? "button" : undefined}
                                                tabIndex={canSchedule ? 0 : undefined}
                                                onClick={() => {
                                                    if (canSchedule) {
                                                        openAppointmentModal(dayKey);
                                                    }
                                                }}
                                                onKeyDown={(event) => {
                                                    if (!canSchedule || (event.key !== "Enter" && event.key !== " ")) return;
                                                    event.preventDefault();
                                                    openAppointmentModal(dayKey);
                                                }}
                                                className={`relative min-h-28 border-b border-r border-gray-200 p-2 last:border-r-0 sm:min-h-32 ${canSchedule ? `cursor-pointer transition ${THEME.HOVER_BACKGROUND}` : ""} ${day.isPast
                                                    ? "bg-gray-100 text-gray-400"
                                                    : day.isCurrentMonth
                                                        ? "bg-white text-gray-800"
                                                        : "bg-gray-50 text-gray-300"
                                                    }`}
                                            >
                                                {currentStaff && appointment && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            removeAppointment(dayKey);
                                                        }}
                                                        className="absolute right-2 top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-white text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-[0.95]"
                                                        aria-label="Remove appointment"
                                                        title="Remove appointment"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <div className="flex justify-start">
                                                    <span
                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${day.isToday
                                                            ? "bg-[#0b1f4d] text-white"
                                                            : ""
                                                            }`}
                                                    >
                                                        {dayLabel}
                                                    </span>
                                                </div>
                                                {appointment && (
                                                    <div className="mt-3 rounded-md bg-[#0b1f4d]/5 p-2 text-xs text-[#0b1f4d]">
                                                        <p className="truncate font-semibold">{getPatientName(appointment.patientId)}</p>
                                                        {currentStaff && (
                                                            <p className="mt-1 truncate text-[#0b1f4d]/70">{getDoctorName(appointment.doctorId)}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {visibleActiveTab === "patients" && !isStaffDashboard && (
                    <>
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950">Patient Snapshot</h2>
                                <p className="text-sm text-gray-500">Recent patients with status and condition count</p>
                            </div>
                            {showUserDirectory && (
                                <Link to="/patients" className={`cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98]`}>
                                    View all
                                </Link>
                            )}
                        </div>
                        <DataTable
                            outerClassName="mx-5 mb-4 overflow-hidden rounded-2xl bg-white"
                            headerRowClassName="border-b border-gray-100 text-xs font-medium text-gray-500"
                            columns={
                                <>
                                    <th className="px-5 py-3">Sl.no.</th>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Last Visit</th>
                                    <th className="px-5 py-3 text-right">Conditions</th>
                                </>
                            }
                            footer={
                                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                                    <p>Showing 1 to {patientSnapshot.length} of {patientSnapshot.length} patients</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled
                                            className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>
                                        <span className="rounded-full bg-gray-100 px-3 py-2 text-gray-700">
                                            1 / {patientSnapshotTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            disabled
                                            className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            {patientSnapshot.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-4 text-sm text-gray-500">
                                        No patients in this scope.
                                    </td>
                                </tr>
                            ) : (
                                patientSnapshot.map((patient, index) => (
                                    <tr
                                        key={patient.id}
                                        onClick={() => navigate(getPatientDetailUrl(patient))}
                                        className={`cursor-pointer transition ${THEME.HOVER_BACKGROUND} active:bg-gray-100`}
                                    >
                                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-gray-950 transition hover:text-[#0b1f4d]">
                                                {getFullName(patient)}
                                            </span>
                                            <p className="text-xs text-gray-500">{patient.address.city}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge tone={getStatusTone(patient.status)}>
                                                {formatLabel(patient.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">{formatShortDate(patient.lastVisitAt)}</td>
                                        <td className="px-5 py-4 text-right font-semibold text-gray-950">{patient.chronicConditions.length}</td>
                                    </tr>
                                ))
                            )}
                        </DataTable>
                    </>
                )}

                {visibleActiveTab === "users" && showUserDirectory && <UserDirectory embedded />}
            </section>

            {selectedAppointmentDateKey && currentStaff && selectedAppointmentDate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    onClick={closeAppointmentModal}
                >
                    <div
                        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950">
                                    Schedule Appointment
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {formatLongDate(selectedAppointmentDate)}
                                </p>
                            </div>
                            <CloseButton
                                onClick={closeAppointmentModal}
                                label="Close appointment scheduler"
                            />
                        </div>

                        {selectedAppointment && isEditingExistingAppointment && (
                            <div className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                Current: {getPatientName(selectedAppointment.patientId)} with {getDoctorName(selectedAppointment.doctorId)}
                            </div>
                        )}

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Patient
                                </label>
                                <Select
                                    value={appointmentPatientId}
                                    options={patientOptions}
                                    onValueChange={setAppointmentPatientId}
                                    ariaLabel="Select appointment patient"
                                    menuClassName="left-0 right-auto"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Doctor
                                </label>
                                <Select
                                    value={appointmentDoctorId}
                                    options={doctorOptions}
                                    onValueChange={setAppointmentDoctorId}
                                    ariaLabel="Select appointment doctor"
                                    menuClassName="left-0 right-auto"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            {selectedAppointment && isEditingExistingAppointment && (
                                <button
                                    type="button"
                                    onClick={() => removeAppointment(selectedAppointmentDateKey)}
                                    className="cursor-pointer rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                                >
                                    Remove
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closeAppointmentModal}
                                className={`cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98]`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveAppointment}
                                className="cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                            >
                                Save Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
