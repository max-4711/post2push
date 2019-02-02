console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);
    self.registration.showNotification(data.title, {
        body: 'Benachrichtigungen aktiviert.',
        icon: 'https://PIPELINE_INSERT_DOMAINNAME/public/success.png'
    });
});