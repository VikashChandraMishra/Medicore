import {
    Activity,
    AlertTriangle,
    CalendarDays,
    HeartPulse,
    PieChart as PieChartIcon,
    ShieldCheck,
    SlidersHorizontal,
    Users,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import Select from "../components/ui/Select";
import { GENDERS, NOTE_TYPES, PATIENT_STATUS, VISIT_TYPES } from "../constants/patient";
import { mockPatients } from "../data/patients";
import type { Patient, Visit } from "../types/patient";
import { useMemo, useState } from "react";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CHART_COLORS = ["#0b1f4d", "#0f766e", "#dc2626", "#7c3aed", "#ca8a04"];

type DateRange = "30d" | "90d" | "180d" | "all";
type VisitFilter = "all" | typeof VISIT_TYPES[keyof typeof VISIT_TYPES];
type StatusFilter = "all" | typeof PATIENT_STATUS[keyof typeof PATIENT_STATUS];
type AnalyticsTab = "charts" | "insurance" | "risk";

type VisitRecord = {
    patient: Patient;
    visit: Visit;
};

function getFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`;
}

function formatLabel(value: string) {
    return value.charAt(0) + value.slice(1).toLowerCase();
}

function getDateKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function formatShortDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

function getLatestActivityDate() {
    const dates = mockPatients.flatMap((patient) => [
        patient.createdAt,
        patient.updatedAt,
        ...(patient.lastVisitAt ? [patient.lastVisitAt] : []),
        ...patient.visits.map((visit) => visit.date),
        ...patient.notes.map((note) => note.createdAt),
    ]);

    return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function getRangeStart(range: DateRange, endDate: Date) {
    if (range === "all") return new Date(0);

    const days = Number(range.replace("d", ""));
    return new Date(endDate.getTime() - days * DAY_IN_MS);
}

function getTimelineData(
    patients: Patient[],
    visits: VisitRecord[],
    startDate: Date,
    endDate: Date,
) {
    const daysInRange = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_IN_MS),
    );
    const bucketSize = daysInRange > 100 ? 7 : 1;
    const buckets = new Map<string, { date: string; visits: number; patients: number }>();
    const safeStart = startDate.getTime() === 0 ? getEarliestDataDate() : startDate;
    const cursor = new Date(safeStart);

    cursor.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
        const key = getDateKey(cursor);

        buckets.set(key, {
            date: bucketSize === 7 ? `Wk ${formatShortDate(cursor)}` : formatShortDate(cursor),
            visits: 0,
            patients: 0,
        });

        cursor.setDate(cursor.getDate() + bucketSize);
    }

    const getBucketKey = (date: Date) => {
        const diff = Math.max(0, date.getTime() - safeStart.getTime());
        const bucketOffset = Math.floor(diff / (bucketSize * DAY_IN_MS)) * bucketSize;
        const bucketDate = new Date(safeStart);

        bucketDate.setHours(0, 0, 0, 0);
        bucketDate.setDate(bucketDate.getDate() + bucketOffset);

        return getDateKey(bucketDate);
    };

    visits.forEach(({ visit }) => {
        const key = getBucketKey(visit.date);
        const bucket = buckets.get(key);

        if (bucket) {
            bucket.visits += 1;
        }
    });

    patients.forEach((patient) => {
        const key = getBucketKey(patient.createdAt);
        const bucket = buckets.get(key);

        if (bucket) {
            bucket.patients += 1;
        }
    });

    return Array.from(buckets.values());
}

function getEarliestDataDate() {
    const dates = mockPatients.flatMap((patient) => [
        patient.createdAt,
        ...patient.visits.map((visit) => visit.date),
    ]);

    return new Date(Math.min(...dates.map((date) => date.getTime())));
}

function getAgeBucket(age: number) {
    if (age < 18) return "0-17";
    if (age < 31) return "18-30";
    if (age < 46) return "31-45";
    if (age < 61) return "46-60";
    return "61+";
}

function getRiskScore(patient: Patient) {
    const emergencyVisits = patient.visits.filter(
        (visit) => visit.type === VISIT_TYPES.EMERGENCY,
    ).length;
    const warningNotes = patient.notes.filter((note) => note.type === NOTE_TYPES.WARNING)
        .length;
    const statusScore = patient.status === PATIENT_STATUS.CRITICAL ? 2 : 0;

    return statusScore + emergencyVisits + warningNotes;
}

function getStatusTone(status: Patient["status"]): BadgeTone {
    if (status === PATIENT_STATUS.CRITICAL) return "red";
    if (status === PATIENT_STATUS.INACTIVE) return "amber";
    return "green";
}

function hasValues<T>(items: T[], getValue: (item: T) => number) {
    return items.some((item) => getValue(item) > 0);
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="grid h-full place-items-center rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
            {message}
        </div>
    );
}

export default function Analytics() {
    const [dateRange, setDateRange] = useState<DateRange>("90d");
    const [visitType, setVisitType] = useState<VisitFilter>("all");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [activeTab, setActiveTab] = useState<AnalyticsTab>("charts");

    const latestActivityDate = getLatestActivityDate();
    const rangeStart = getRangeStart(dateRange, latestActivityDate);

    const filteredPatients = useMemo(() => {
        return mockPatients.filter((patient) => {
            const matchesStatus = status === "all" || patient.status === status;
            const isInRange = patient.createdAt >= rangeStart || patient.updatedAt >= rangeStart;

            return matchesStatus && (dateRange === "all" || isInRange);
        });
    }, [dateRange, rangeStart, status]);

    const filteredVisits = useMemo(() => {
        return mockPatients.flatMap((patient) =>
            patient.visits
                .filter((visit) => dateRange === "all" || visit.date >= rangeStart)
                .filter((visit) => visitType === "all" || visit.type === visitType)
                .filter(() => status === "all" || patient.status === status)
                .map((visit) => ({ patient, visit })),
        );
    }, [dateRange, rangeStart, status, visitType]);

    const timelineData = getTimelineData(
        filteredPatients,
        filteredVisits,
        rangeStart,
        latestActivityDate,
    );
    const visitTypeData = Object.values(VISIT_TYPES).map((type) => ({
        name: formatLabel(type),
        value: filteredVisits.filter(({ visit }) => visit.type === type).length,
    }));
    const conditionData = Object.entries(
        filteredPatients.reduce<Record<string, number>>((acc, patient) => {
            patient.chronicConditions.forEach((condition) => {
                acc[condition] = (acc[condition] ?? 0) + 1;
            });

            return acc;
        }, {}),
    )
        .map(([condition, count]) => ({ condition, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    const ageData = ["0-17", "18-30", "31-45", "46-60", "61+"].map((bucket) => ({
        bucket,
        patients: filteredPatients.filter((patient) => getAgeBucket(patient.age) === bucket)
            .length,
    }));
    const genderData = Object.values(GENDERS).map((gender) => ({
        name: formatLabel(gender),
        value: filteredPatients.filter((patient) => patient.gender === gender).length,
    }));
    const activePolicies = filteredPatients.filter((patient) => patient.insurance.isActive)
        .length;
    const inactivePolicies = filteredPatients.length - activePolicies;
    const expiringSoon = filteredPatients.filter((patient) => {
        const expiresIn = patient.insurance.validUntil.getTime() - latestActivityDate.getTime();

        return patient.insurance.isActive && expiresIn >= 0 && expiresIn <= 90 * DAY_IN_MS;
    });
    const riskPatients = filteredPatients
        .map((patient) => ({
            patient,
            score: getRiskScore(patient),
            emergencyVisits: patient.visits.filter(
                (visit) => visit.type === VISIT_TYPES.EMERGENCY,
            ).length,
            warningNotes: patient.notes.filter((note) => note.type === NOTE_TYPES.WARNING)
                .length,
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
    const hasTimelineData = hasValues(timelineData, (item) => item.visits + item.patients);
    const hasVisitTypeData = hasValues(visitTypeData, (item) => item.value);
    const hasConditionData = hasValues(conditionData, (item) => item.count);
    const hasAgeData = hasValues(ageData, (item) => item.patients);
    const hasGenderData = hasValues(genderData, (item) => item.value);

    const dateOptions = [
        { label: "Last 30 days", value: "30d" },
        { label: "Last 90 days", value: "90d" },
        { label: "Last 180 days", value: "180d" },
        { label: "All time", value: "all" },
    ];
    const visitOptions = [
        { label: "All visit types", value: "all" },
        ...Object.values(VISIT_TYPES).map((type) => ({
            label: formatLabel(type),
            value: type,
        })),
    ];
    const statusOptions = [
        { label: "All statuses", value: "all" },
        ...Object.values(PATIENT_STATUS).map((patientStatus) => ({
            label: formatLabel(patientStatus),
            value: patientStatus,
        })),
    ];
    const analyticsTabs: Array<{ label: string; value: AnalyticsTab }> = [
        { label: "Clinical Charts", value: "charts" },
        { label: "Insurance Insights", value: "insurance" },
        { label: "Risk Analysis", value: "risk" },
    ];
    const summaryMetrics = [
        { label: "Patients", value: filteredPatients.length, icon: Users },
        { label: "Visits", value: filteredVisits.length, icon: CalendarDays },
        { label: "High-risk", value: riskPatients.length, icon: HeartPulse },
        { label: "Policies Expiring Soon", value: expiringSoon.length, icon: ShieldCheck },
    ];

    return (
        <div className="min-h-full bg-gray-50 text-gray-800">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#0b1f4d]/8 px-3 py-1 text-sm font-medium text-[#0b1f4d]">
                        <Activity className="h-4 w-4" />
                        Exploratory analytics
                    </p>
                    <h1 className="text-3xl font-semibold tracking-normal text-gray-950">
                        Analytics
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Trends, demographics, risk, insurance, and condition signals
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                        className="[&_button]:h-9 [&_button]:rounded-lg"
                        value={dateRange}
                        options={dateOptions}
                        onValueChange={(value) => setDateRange(value as DateRange)}
                        ariaLabel="Filter analytics by date range"
                    />
                    <Select
                        className="[&_button]:h-9 [&_button]:rounded-lg"
                        value={visitType}
                        options={visitOptions}
                        onValueChange={(value) => setVisitType(value as VisitFilter)}
                        ariaLabel="Filter analytics by visit type"
                    />
                    <Select
                        className="[&_button]:h-9 [&_button]:rounded-lg"
                        value={status}
                        options={statusOptions}
                        onValueChange={(value) => setStatus(value as StatusFilter)}
                        ariaLabel="Filter analytics by patient status"
                    />
                </div>
            </div>

            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {summaryMetrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div key={metric.label} className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <Icon className="h-3.5 w-3.5" />
                                {metric.label}
                            </p>
                            <p className="font-medium text-gray-800">{metric.value}</p>
                        </div>
                    );
                })}
            </section>

            <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex gap-1 overflow-x-auto border-b border-gray-100 p-2" role="tablist" aria-label="Analytics sections">
                    {analyticsTabs.map((tab) => {
                        const isActive = activeTab === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.value)}
                                className={`shrink-0 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${isActive
                                    ? "bg-[#0b1f4d] text-white"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-[#0b1f4d]"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === "charts" && (
                    <div className="grid gap-6 p-5 xl:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">
                            Time-Based Trends
                        </h2>
                        <p className="text-sm text-gray-500">Visits and new patients over time</p>
                    </div>
                    <div className="h-80 p-5">
                        {hasTimelineData ? (
                            <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData} margin={{ left: -18, right: 8, top: 8 }}>
                                <defs>
                                    <linearGradient id="analyticsVisits" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="5%" stopColor="#0b1f4d" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#0b1f4d" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="analyticsPatients" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.24} />
                                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
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
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                <Area
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#0b1f4d"
                                    strokeWidth={3}
                                    fill="url(#analyticsVisits)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="patients"
                                    stroke="#0f766e"
                                    strokeWidth={3}
                                    fill="url(#analyticsPatients)"
                                />
                            </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="No visit or patient trend data matches the selected filters." />
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">
                            Visit Type Distribution
                        </h2>
                        <p className="text-sm text-gray-500">Routine, follow-up, emergency, consultation</p>
                    </div>
                    <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                        {hasVisitTypeData ? (
                            <>
                                <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={visitTypeData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={92}
                                        paddingAngle={3}
                                    >
                                        {visitTypeData.map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                </PieChart>
                            </ResponsiveContainer>
                                </div>
                                <div className="space-y-3 self-center">
                            {visitTypeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                        />
                                        {entry.name}
                                    </span>
                                    <span className="font-semibold text-gray-950">{entry.value}</span>
                                </div>
                            ))}
                                </div>
                            </>
                        ) : (
                            <div className="lg:col-span-2 h-72">
                                <EmptyChart message="No visit type data matches the selected filters." />
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">
                            Condition Insights
                        </h2>
                        <p className="text-sm text-gray-500">Most common chronic conditions</p>
                    </div>
                    <div className="h-86 p-5">
                        {hasConditionData ? (
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conditionData} layout="vertical" margin={{ left: 8, right: 20 }}>
                                <CartesianGrid stroke="#eef2f7" horizontal={false} />
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="condition"
                                    width={160}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#4b5563", fontSize: 12 }}
                                />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                <Bar dataKey="count" fill="#0b1f4d" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="No chronic condition data matches the selected filters." />
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-950">Demographics</h2>
                        <p className="text-sm text-gray-500">Age buckets and gender split</p>
                    </div>
                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                        {hasAgeData || hasGenderData ? (
                            <>
                                <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData} margin={{ left: -18, right: 8, top: 8 }}>
                                    <CartesianGrid stroke="#eef2f7" vertical={false} />
                                    <XAxis
                                        dataKey="bucket"
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
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                    <Bar dataKey="patients" fill="#0f766e" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                                </div>
                                <div>
                            <div className="h-56">
                                {hasGenderData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={82}>
                                            {genderData.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                                    </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart message="No gender data matches the selected filters." />
                                )}
                            </div>
                            <div className="mt-3 grid gap-2 text-sm">
                                {genderData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-2 text-gray-600">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                            {entry.name}
                                        </span>
                                        <span className="font-semibold text-gray-950">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                                </div>
                            </>
                        ) : (
                            <div className="lg:col-span-2 h-72">
                                <EmptyChart message="No demographic data matches the selected filters." />
                            </div>
                        )}
                    </div>
                </div>
                    </div>
                )}

                {activeTab === "insurance" && (
                    <div className="p-5">
                        <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-950">
                                Insurance Insights
                            </h2>
                            <p className="text-sm text-gray-500">Policy activity and expirations</p>
                        </div>
                        <PieChartIcon className="h-5 w-5 text-sky-700" />
                    </div>
                    <div className="p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#0b1f4d]" />
                                    Active Policies
                                </p>
                                <p className="font-medium text-gray-800">
                                    {activePolicies}
                                </p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                    <PieChartIcon className="h-3.5 w-3.5 text-gray-500" />
                                    Inactive Policies
                                </p>
                                <p className="font-medium text-gray-800">
                                    {inactivePolicies}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 max-h-72 space-y-3 overflow-y-auto">
                            {expiringSoon.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                                    No active policies expire within 90 days.
                                </p>
                            ) : (
                                expiringSoon.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-950">
                                                {getFullName(patient)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {patient.insurance.provider}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">
                                            {formatShortDate(patient.insurance.validUntil)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                    </div>
                )}

                {activeTab === "risk" && (
                    <div className="p-5">
                        <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-950">
                                Risk Analysis
                            </h2>
                            <p className="text-sm text-gray-500">
                                Critical status, emergency visits, and warning notes combined
                            </p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-700" />
                    </div>
                    <div className="max-h-110 overflow-y-auto">
                        {riskPatients.length === 0 ? (
                            <p className="m-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                                No risk signals match the selected filters.
                            </p>
                        ) : (
                            riskPatients.map((entry) => (
                                <div
                                    key={entry.patient.id}
                                    className="grid gap-3 border-b border-gray-100 px-5 py-4 md:grid-cols-[1fr_auto]"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-gray-950">
                                                {getFullName(entry.patient)}
                                            </p>
                                            <Badge tone={getStatusTone(entry.patient.status)}>
                                                {formatLabel(entry.patient.status)}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {entry.patient.chronicConditions.join(", ") || "General care"}
                                        </p>
                                    </div>
                                    <div className="text-sm md:text-right">
                                        <p className="font-semibold text-red-700">
                                            Risk score {entry.score}
                                        </p>
                                        <p className="mt-1 text-gray-500">
                                            {entry.emergencyVisits} ER visit
                                            {entry.emergencyVisits === 1 ? "" : "s"} ·{" "}
                                            {entry.warningNotes} warning
                                            {entry.warningNotes === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                    </div>
                )}
            </section>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                <SlidersHorizontal className="h-4 w-4 text-[#0b1f4d]" />
                Filters update charts, counts, condition rankings, demographics, insurance, and risk lists.
            </div>
        </div>
    );
}
