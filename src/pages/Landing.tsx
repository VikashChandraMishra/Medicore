import {
    Activity,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import { THEME } from "../constants/theme";

const featureCards = [
    {
        title: "Patient Records",
        description: "Search, filter, and review visit history across grid and list views.",
        icon: UsersRound,
    },
    {
        title: "Smart Scheduling",
        description: "Coordinate appointments between staff, doctors, and patients.",
        icon: CalendarClock,
    },
    {
        title: "Clinical Analytics",
        description: "Track trends, risks, insurance health, and recent activity.",
        icon: BarChart3,
    },
];

const qualitySignals = [
    "Firebase authentication",
    "Protected clinical workspace",
    "Service worker notifications",
];

const readmeUrl = "https://github.com/VikashChandraMishra/Medicore/blob/main/README.md";

export default function Landing() {
    return (
        <div className={`min-h-screen ${THEME.SITE_BACKGROUND} text-gray-800`}>
            <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pt-16">
                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-[#0b1f4d] shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                        Healthcare SaaS workspace
                    </div>

                    <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-gray-950 sm:text-5xl lg:text-6xl">
                        Medicore
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
                        A focused clinic operations interface for patient records,
                        appointments, analytics, and role-aware dashboards.
                    </p>

                    <div className="mt-5 rounded-lg bg-white px-4 py-3 text-sm leading-6 text-gray-600 shadow-sm">
                        Demo credentials are listed in the{" "}
                        <a
                            href={readmeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#0b1f4d] underline-offset-4 hover:underline"
                        >
                            repository README
                        </a>
                        . New user accounts cannot be created from the app.
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/auth/login"
                            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-[#0b1f4d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                        >
                            Open workspace
                        </Link>
                        <a
                            href="#features"
                            className={`inline-flex cursor-pointer items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98]`}
                        >
                            View capabilities
                        </a>
                    </div>

                    <div className="mt-8 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                        {qualitySignals.map((signal) => (
                            <p key={signal} className="inline-flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#0b1f4d]" />
                                {signal}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-2xl shadow-gray-300/50 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Medicore"
                                className="h-11 w-11 object-contain"
                            />
                            <div>
                                <p className="font-semibold text-gray-950">Live Clinic Overview</p>
                                <p className="text-sm text-gray-500">Operational snapshot</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Online
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            ["Patients", "128"],
                            ["Appointments", "24"],
                            ["Revenue", "$42.8K"],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="mt-1 text-xl font-semibold text-gray-950">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-950">Visits Trend</p>
                            <Activity className="h-4 w-4 text-[#0b1f4d]" />
                        </div>
                        <div className="flex h-36 items-end gap-2">
                            {[36, 68, 52, 86, 62, 94, 74].map((height, index) => (
                                <div key={index} className="flex flex-1 items-end rounded bg-white">
                                    <div
                                        className="w-full rounded bg-[#0b1f4d]"
                                        style={{ height: `${height}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:px-6 md:grid-cols-3">
                {featureCards.map((feature) => {
                    const Icon = feature.icon;

                    return (
                        <div key={feature.title} className="rounded-xl bg-white p-5 shadow-sm">
                            <Icon className="h-5 w-5 text-[#0b1f4d]" />
                            <h2 className="mt-4 text-lg font-semibold text-gray-950">
                                {feature.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {feature.description}
                            </p>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}
