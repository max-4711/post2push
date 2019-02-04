console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);

    if (data.icon !== null && typeof data.icon !== 'undefined') {
        if (data.actions !== null && typeof data.actions !== 'undefined') {
            console.log('Showing notification with icon and actions');
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                requireInteraction: data.requireInteraction,
                actions: data.actions
            });
        }
        else {
            console.log('Showing notification with icon');
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                requireInteraction: data.requireInteraction
            });
        }
    }
    else {
        if (data.actions !== null && typeof data.actions !== 'undefined') {
            console.log('Showing notification with actions');
            self.registration.showNotification(data.title, {
                body: data.body,
                requireInteraction: data.requireInteraction,
                actions: data.actions
            });
        }
        else {
            console.log('Showing plain notification');
            self.registration.showNotification(data.title,
            {
                body: data.body,
                requireInteraction: data.requireInteraction
            });
        }
    }
});

self.addEventListener('notificationclick', e => {
    console.log('Got notification click', e);
    var notification = e.notification;
    var action = e.action;

    if (action === 'dismiss') {
        console.log('Closing notification');
        notification.close();
    } else {
        var actionUrl = action;
        notification.close();
        e.waitUntil(
            clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(windowClients => {
                console.log('Trying to open or focus ' + actionUrl);

                //Check auf schon offenes Fenster mit Ziel-URL
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    //Wenn ja, fokussieren
                    if (client.url === actionUrl && 'focus' in client) {
                        console.log('Focus existing one');
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    console.log('Open new window');
                    return clients.openWindow(actionUrl);
                }
            })
        );
    }
});