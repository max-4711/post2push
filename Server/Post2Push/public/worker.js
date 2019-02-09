console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const showNotificationPromise = new Promise((resolve, reject) => {
        const data = ev.data.json();

        if (data.icon !== null && typeof data.icon !== 'undefined') {
            if (data.actions !== null && typeof data.actions !== 'undefined') {
                return self.registration.showNotification(data.title, {
                    body: data.body,
                    icon: data.icon,
                    requireInteraction: data.requireInteraction,
                    actions: data.actions
                });
            }
            else {
                return self.registration.showNotification(data.title, {
                    body: data.body,
                    icon: data.icon,
                    requireInteraction: data.requireInteraction
                });
            }
        }
        else {
            if (data.actions !== null && typeof data.actions !== 'undefined') {
                return self.registration.showNotification(data.title, {
                    body: data.body,
                    requireInteraction: data.requireInteraction,
                    actions: data.actions
                });
            }
            else {
                return self.registration.showNotification(data.title, {
                        body: data.body,
                        requireInteraction: data.requireInteraction
                });
            }
        }
    });
    ev.waitUntil(showNotificationPromise);
});

self.addEventListener('notificationclick', e => {
    console.log('Got notification click', e);
    var notification = e.notification;
    var action = e.action;

    if (action === null || typeof action === 'undefined' || action === '') {
        console.log('No action, doing nothing');        
    } 
    else if (action === 'dismiss') {
        notification.close();
    }
    else {
        var actionUrl = action;
        notification.close();
        e.waitUntil(
            clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(windowClients => {
                //Check auf schon offenes Fenster mit Ziel-URL
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    //Wenn ja, fokussieren
                    if (client.url === actionUrl && 'focus' in client) {
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(actionUrl);
                }
            })
        );
    }
});