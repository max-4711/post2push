﻿const publicVapidKey = 'PIPELINE_INSERT_PUBLICVAPIDKEY';
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

    if (channelname === '' || channelname === null || typeof channelname === 'undefined') {
        alert('Please enter a channel name!');
        return;
    }

    if (channelcreationsecret === '' || channelcreationsecret === null || typeof channelcreationsecret === 'undefined') {
        alert('Please enter the channel creation secret!');
        return;
    }

    document.getElementById("createchannelbutton").disabled = true;
    document.getElementById("createchannelbutton").innerText = 'Working on it...';

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

    var alertClassName = "alert alert-danger";
    await fetch('https://PIPELINE_INSERT_APP_URL/channels', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        res.text().then((text) => {
            document.getElementById("createchannelbutton").disabled = false;
            document.getElementById("createchannelbutton").innerText = 'Create';
            if (res.ok) {
                alertClassName = "alert alert-success";
            }
            else {
                alertClassName = "alert alert-danger";
            }
            var labelobject = document.getElementById('create_feedbackalert');
            labelobject.innerText = text;
            labelobject.className = alertClassName;
            labelobject.removeAttribute("hidden");
        });
    });
}

async function run() {
    var channelname = document.getElementById('subscribe_channelnameinput').value;
    var subscriptionsecret = document.getElementById('subscribe_channelsubscriptionsecret').value;

    if (deliveryDetails === null || typeof deliveryDetails === 'undefined') {
        console.log('deliveryDetails not set - unable to publish endpoint!');
        return;
    }

    if (channelname === '' || channelname === null || typeof channelname === 'undefined') {
        alert('Please enter a channel name!');
        return;
    }

    document.getElementById("subscribebutton").disabled = true;
    document.getElementById("subscribebutton").innerText = 'Working on it...';

    var subscription = {
        ChannelName: channelname,
        DeliveryDetails: deliveryDetails,
        ChannelSubscriptionSecret: subscriptionsecret
    };

    var labelobject = document.getElementById('subscribe_feedbackalert');
    var labelobjectclass = "alert alert-danger";
    
    console.log('Registering push endpoint...');

    await fetch('https://PIPELINE_INSERT_APP_URL/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        res.text().then((text) => {
            document.getElementById("subscribebutton").disabled = false;
            document.getElementById("subscribebutton").innerText = 'Subscribe';

            if (res.ok)
            {
                var responseJson = JSON.parse(text);
                console.log('Saving endpoint to cookie...');
                var cookie = getCookie(cookieName);
                if (cookie === null || typeof cookie === 'undefined') {
                    console.log('No cookie found, creating new one...');
                    var newCookie = [responseJson.SubscriptionToken];
                    var newCookieStringified = JSON.stringify(newCookie);
                    setCookie(cookieName, newCookieStringified, 1825);
                }
                else {
                    console.log('Cookie found, adding the new token to it...');
                    var oldSubscriptionTokens = JSON.parse(cookie);
                    oldSubscriptionTokens.push(responseJson.SubscriptionToken);
                    var newCookieStringified = JSON.stringify(oldSubscriptionTokens);
                    setCookie(cookieName, newCookieStringified, 1825);
                }      
                labelobjectclass = "alert alert-success";
            }                
            labelobject.innerText = text;
            labelobject.className = labelobjectclass;
            labelobject.removeAttribute("hidden");
                
            console.log('Completed!');
        });
    });
}

var deliveryDetails;
var existingEndpointsUpdated = false;
async function updateExistingEndpoints() {
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.
        register('https://PIPELINE_INSERT_APP_URL/public/worker.js', { scope: '/post2push/public/' });

    console.log('Registering push...');
    deliveryDetails = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // The `urlBase64ToUint8Array()` function is the same as in
        // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    var cookie = getCookie(cookieName);

    if (typeof cookie === 'undefined' || cookie === null) {
        console.log('No cookie detected -> no endpoints need to be updated.');
        existingEndpointsUpdated = true;
        return;
    }

    var subscriptionTokens = JSON.parse(cookie);
    console.log('Found ' + subscriptionTokens.length + ' tokens, for which endpoints will be updated...');

    var index = 0;
    subscriptionTokens.forEach(function (subscriptionToken) {
        console.log('Updating endpoint for token ' + subscriptionToken + '...');
        if (subscriptionToken === 'null' || subscriptionToken === null || typeof subscriptionToken === 'undefined') {
            console.log('Token ' + subscriptionToken + ' is obviously invalid, skipping to update that!');

            index++;
            if (index === subscriptionTokens.length) {
                console.log('Done updating endpoints!');
                existingEndpointsUpdated = true;
                document.getElementById("subscribebutton").disabled = false;
                document.getElementById("apiupdatespinnertext").innerText = 'Done!';
                document.getElementById("apiupdatespinner").style.display = 'none';
            }

            return;
        }

        var targetUrl = 'https://PIPELINE_INSERT_APP_URL/subscriptions/' + subscriptionToken;
        var payload = {
            DeliveryDetails: deliveryDetails
        };

        fetch(targetUrl, {
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
                    console.log('Done updating endpoints!');
                    existingEndpointsUpdated = true;
                    document.getElementById("subscribebutton").disabled = false;
                    document.getElementById("apiupdatespinnertext").innerText = 'Done!';
                    document.getElementById("apiupdatespinner").style.display = 'none';
                }
            });
        });
    });
}

window.addEventListener('load', function () {
    console.log('Window is ready!');
    updateExistingEndpoints();
})

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