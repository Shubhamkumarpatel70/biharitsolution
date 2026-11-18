self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  const title = payload.title || 'ASKC TECHNOLOGIES';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: '/askcfavicon.png',
    badge: '/askcfavicon.png',
    data: { url: payload.url || '/dashboard/notifications' },
    tag: payload.notificationId || 'askc-notification',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/dashboard/notifications', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
