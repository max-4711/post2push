console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);

    if (data.icon !== null && typeof data.icon !== 'undefined') {
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon
        });
    }
    else {
        self.registration.showNotification(data.title, { body: data.body });
    }
});