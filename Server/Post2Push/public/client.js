const publicVapidKey = 'PIPELINE_INSERT_PUBLICVAPIDKEY';

function subscribechannel() {
    if ('serviceWorker' in navigator) {
        run().catch(error => console.error(error));
    }
    else {
        alert('Your browser does not support service workers. Unfortunately, service workers are required to implement background notifications. Please try another browser.');
    }    
}

async function createchannel() {
    var channelname = document.getElementById('create_channelnameinput').value;
    var subscriptionsecret = document.getElementById('create_channelsubscriptionsecret').value;
    var notificationiconuri = document.getElementById('create_notificationiconuri').value;
    var channelcreationsecret = document.getElementById('create_channelcreationsecret').value;

    var payload = {
        Name: channelname,
        ChannelCreationSecret: channelcreationsecret
    };
    if (subscriptionsecret !== null && typeof subscriptionsecret !== 'undefined' && subscriptionsecret !== '') {
        payload.SubscriptionSecret = subscriptionsecret;
    }
    if (notificationiconuri !== null && typeof notificationiconuri !== 'undefined' && notificationiconuri !== '') {
        payload.IconUrl = notificationiconuri;
    }

    var color = "red";
    await fetch('https://PIPELINE_INSERT_APP_URL/channels', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        res.text().then((text) => {
            if (res.ok) { color = "green"; }
            document.getElementById('create_apiresponse').innerText = '<font color="' + color + '">' + text + "</font>";
        });
    });
}

async function run() {
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.
        register('https://PIPELINE_INSERT_APP_URL/public/worker.js', { scope: '/post2push/public/' });

    console.log('Registering push...');
    var deliveryDetails = await registration.pushManager.
        subscribe({
            userVisibleOnly: true,
            // The `urlBase64ToUint8Array()` function is the same as in
            // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

    var channelname = document.getElementById('subscribe_channelnameinput').value;
    var subscriptionsecret = document.getElementById('subscribe_channelsubscriptionsecret').value;

    var subscription = {
        ChannelName: channelname,
        DeliveryDetails: deliveryDetails,
        ChannelSubscriptionSecret: subscriptionsecret
    };

    var color = "red";
    console.log('Sending push endpoint data...');
    await fetch('https://PIPELINE_INSERT_APP_URL/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        res.text().then((text) => {
            if (res.ok) { color = "green"; }
            document.getElementById('subscribe_apiresponse').innerText = '<font color="' + color + '">' + text + "</font>";
        });
    });
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