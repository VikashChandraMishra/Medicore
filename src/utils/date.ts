export function formatShortDate(date?: Date) {
    if (!date) return "No visits";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

export function formatDateTime(date?: Date) {
    if (!date) return "No visits";

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatMonthYear(date: Date) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
    }).format(date);
}

export function formatLongDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

export function formatRelativeTime(date: Date, now: Date) {
    const diff = Math.max(0, now.getTime() - date.getTime());
    const hours = Math.floor(diff / (60 * 60 * 1000));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
}

export function getDateKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}
