console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);

    if (data.icon !== null && typeof data.icon !== 'undefined') {
        if (data.actions !== null && typeof data.actions !== 'undefined') { //Icon+Actions            
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                requireInteraction: data.requireInteraction,
                actions: data.actions
            });
        }
        else { //Icon            
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                requireInteraction: data.requireInteraction
            });
        }
    }
    else {
        if (data.actions !== null && typeof data.actions !== 'undefined') { //Actions            
            self.registration.showNotification(data.title, {
                body: data.body,
                requireInteraction: data.requireInteraction,
                actions: data.actions
            });
        }
        else { //Nichts
            self.registration.showNotification(data.title,
            {
                body: data.body,
                requireInteraction: data.requireInteraction
            });
        }
    }
});

self.addEventListener('notificationclick', function (e) {
    var notification = e.notification;
    var actionUrl = notification.data.actionUrl;
    var action = e.action;

    if (action === 'details') {
        notification.close();
        e.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
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
    } else {        
        notification.close();
    }
});