export function getNotificationStatus(permission: NotificationPermission) {
    if (permission === "granted") return { label: "Notifications enabled", tone: "green" as const };
    if (permission === "denied") return { label: "Notifications blocked", tone: "red" as const };
    return { label: "Notifications not enabled", tone: "amber" as const };
}

export async function showServiceWorkerNotification(title: string, options: NotificationOptions) {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service worker notifications are unavailable.");
    }

    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
        ...options,
        requireInteraction: true,
    });
}
