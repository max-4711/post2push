self.addEventListener('push', ev => {
    const showNotificationPromise = new Promise((resolve, reject) => {
        const data = ev.data.json();

        if (data.icon === null || typeof data.icon === 'undefined' || data.icon === '') {
            if (data.actions === null || typeof data.actions === 'undefined') {
                if (data.tag === null || typeof data.tag === 'undefined' || data.tag === '') {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        badge: data.badge
                    });
                }
                else {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        badge: data.badge,
                        tag: data.tag
                    });
                }
            }
            else {
                if (data.tag === null || typeof data.tag === 'undefined' || data.tag === '') {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        actions: data.actions,
                        badge: data.badge
                    });
                }
                else {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        actions: data.actions,
                        badge: data.badge,
                        tag: data.tag
                    });
                }
            }
        }
        else {
            if (data.actions === null || typeof data.actions === 'undefined') {
                if (data.tag === null || typeof data.tag === 'undefined' || data.tag === '') {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        icon: data.icon,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        badge: data.badge
                    });
                }
                else {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        icon: data.icon,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        badge: data.badge,
                        tag: data.tag
                    });
                }
            }
            else {
                if (data.tag === null || typeof data.tag === 'undefined' || data.tag === '') {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        icon: data.icon,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        actions: data.actions,
                        badge: data.badge
                    });
                }
                else {
                    return self.registration.showNotification(data.title, {
                        body: data.body,
                        icon: data.icon,
                        requireInteraction: data.requireInteraction,
                        timestamp: data.timestamp,
                        actions: data.actions,
                        badge: data.badge,
                        tag: data.tag
                    });
                }
            }
        }
    });
    ev.waitUntil(showNotificationPromise);
});

self.addEventListener('notificationclick', e => {
    var notification = e.notification;
    var action = e.action;

    if (action === null || typeof action === 'undefined' || action === '') {
        console.log('No action, doing nothing');        
    } 
    else if (action === 'dismiss') {
        notification.close();
    }
    else {
        notification.close();
        e.waitUntil(
            clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(windowClients => {                
                var actionUrl = action;

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