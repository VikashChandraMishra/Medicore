import type { ReactNode } from "react";

export type BadgeTone = "accent" | "green" | "red" | "amber" | "emerald" | "sky";

type BadgeProps = {
    children: ReactNode;
    tone: BadgeTone;
    selected?: boolean;
};

const toneClasses: Record<BadgeTone, string> = {
    accent: "bg-[#0b1f4d]",
    green: "bg-green-700",
    red: "bg-red-700",
    amber: "bg-amber-700",
    emerald: "bg-emerald-700",
    sky: "bg-sky-700",
};

export default function Badge({ children, tone, selected = false }: BadgeProps) {
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${selected
            ? "bg-white text-[#0b1f4d]"
            : `text-white ${toneClasses[tone]}`
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-current" : "bg-white"}`} />
            {children}
        </span>
    );
}
