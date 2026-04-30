export function stripDoctorPrefix(name: string) {
    return name.replace(/^\s*dr\.?\s+/i, "");
}

export function getInitialsFromName(name: string) {
    return stripDoctorPrefix(name)
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}
