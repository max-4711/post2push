const publicVapidKey = 'PIPELINE_INSERT_PUBLICVAPIDKEY';
const cookieName = 'SubscriptionsCookie';

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
            var labelobject = document.getElementById('create_apiresponse');
            labelobject.innerText = text;
            labelobject.style.color = color;
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

    var labelobject = document.getElementById('subscribe_apiresponse');
    var cookie = getCookie(cookieName);

    var color = "red";
    if (cookie !== null) {
        console.log('Registering push endpoint...');

        await fetch('https://PIPELINE_INSERT_APP_URL/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'content-type': 'application/json'
            }
        }).then((res) => {
            res.text().then((text) => {
                if (res.ok) { color = "green"; }                
                labelobject.innerText = text;
                labelobject.style.color = color;

                console.log('Saving endpoint to cookie...');
                var responseJson = JSON.parse(text);                
                var newCookie = [responseJson.SubscriptionToken];
                var newCookieStringified = JSON.stringify(newCookie);
                setCookie(cookieName, newCookieStringified, 1825);
                console.log('Completed!');
            });
        });
    }
    else {
        console.log('Updating push endpoint(s)...');
        
        labelobject.innerText = 'Updating push endpoint data for existing subscriptions (see dev console for more details)...';
        labelobject.style.color = 'orange';

        var subscriptionTokens = JSON.parse(cookie);

        console.log('Found ' + subscriptionTokens.length + ' tokens, for which endpoints will be updated...');

        var index = 0;
        subscriptionTokens.forEach(function (subscriptionToken)
        {
            console.log('Updateing endpoint for token ' + subscriptionToken + '...');
            var targetUrl = 'https://PIPELINE_INSERT_APP_URL/subscriptions/' + subscriptionToken;
            var payload = {
                DeliveryDetails: deliveryDetails
            };

            await fetch(targetUrl, {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json'
                }
            }).then((res) => {
                res.text().then((text) => {
                    console.log('Endpoint for token ' + subscriptionToken + ' updated: ' + text);
                    index++;
                    if (index === subscriptionTokens.length) {
                        console.log('Now finally registering new push endpoint...');
                        document.getElementById('subscribe_apiresponse').innerText = 'Registering new push endpoint...';

                        await fetch('https://PIPELINE_INSERT_APP_URL/subscriptions', {
                            method: 'POST',
                            body: JSON.stringify(subscription),
                            headers: {
                                'content-type': 'application/json'
                            }
                        }).then((res) => {
                            res.text().then((text) => {
                                console.log('Endpoint registered: ' + text);
                                if (res.ok) { color = "green"; }
                                else { color = "red"; }
                                labelobject.innerText = text;
                                labelobject.style.color = color;

                                console.log('Saving new token to cookie...');
                                var responseJson = JSON.parse(text);
                                var newToken = [responseJson.SubscriptionToken];
                                subscriptionTokens.push(newToken);
                                var newCookieStringified = JSON.stringify(subscriptionTokens);
                                setCookie(cookieName, newCookieStringified, 1825);
                                console.log('Completed!');
                            });
                        });

                    }                    
                });
            });
        });
    }
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


function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}