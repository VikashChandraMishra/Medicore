self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url ?? "/dashboard";

    event.waitUntil(
        self.clients
            .matchAll({
                type: "window",
                includeUncontrolled: true,
            })
            .then((clientList) => {
                const existingClient = clientList.find((client) =>
                    client.url.includes(targetUrl),
                );

                if (existingClient) {
                    return existingClient.focus();
                }

                return self.clients.openWindow(targetUrl);
            }),
    );
});
