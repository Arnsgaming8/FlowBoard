const channel = new BroadcastChannel("flowboard-reminders");

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const taskId = event.notification.data?.taskId;

  if (event.action === "dismiss") {
    channel.postMessage({ type: "DISMISS_TASK", taskId });
  } else if (event.action === "snooze") {
    channel.postMessage({ type: "SNOOZE_TASK", taskId });
  } else {
    event.waitUntil(clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    }));
  }
});
