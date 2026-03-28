const CHANNEL_NAME = "flowboard-reminders";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const taskId = notification.data?.taskId;
  notification.close();

  if (event.action === "dismiss") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "DISMISS_TASK", taskId });
    channel.close();
  } else if (event.action === "snooze") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "SNOOZE_TASK", taskId });
    channel.close();
  } else {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow("/");
      })
    );
  }
});
