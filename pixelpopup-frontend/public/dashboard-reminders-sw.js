self.addEventListener("push", (event) => {
  const payload = event.data?.json() || {};
  if (payload.type !== "personal-reminder") return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const focused = windows.find((client) => client.focused && new URL(client.url).pathname.startsWith("/dashboard"));
    if (focused) {
      focused.postMessage({ type: "personal-reminder", delivery_id: payload.delivery_id });
      return;
    }
    await self.registration.showNotification("Your important-task checklist", {
      body: "Open your personal dashboard to see what needs attention.",
      tag: `personal-reminder-${payload.delivery_id}`,
      data: { delivery_id: payload.delivery_id },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const dashboard = windows.find((client) => new URL(client.url).pathname.startsWith("/dashboard"));
    if (dashboard) {
      await dashboard.focus();
      dashboard.postMessage({ type: "personal-reminder", delivery_id: event.notification.data?.delivery_id });
    } else {
      await self.clients.openWindow("/dashboard");
    }
  })());
});
