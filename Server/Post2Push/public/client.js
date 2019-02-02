const publicVapidKey = 'PIPELINE_INSERT_PUBLICVAPIDKEY';

if ('serviceWorker' in navigator) {
    console.log('Registering service worker');

    run().catch(error => console.error(error));
}

async function run() {
    console.log('Registering service worker');
    const registration = await navigator.serviceWorker.
        register('https://PIPELINE_INSERT_APP_URL/public/worker.js', { scope: '/post2push/public/' });
    console.log('Registered service worker');

    console.log('Registering push');
    var deliveryDetails = await registration.pushManager.
        subscribe({
            userVisibleOnly: true,
            // The `urlBase64ToUint8Array()` function is the same as in
            // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
    console.log('Registered push');

    var subscription = {
        ChannelName: 'TestChannel',
        DeliveryDetails: deliveryDetails,
        ChannelSubscriptionSecret: 'TestChannelSecret'
    };

    console.log('Sending push');
    await fetch('https://PIPELINE_INSERT_APP_URL/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'content-type': 'application/json'
        }
    });
    console.log('Sent push');
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}