const publicVapidKey = 'PIPELINE_INSERT_PUBLICVAPIDKEY';
const cookieName = 'SubscriptionsCookie';

function subscribechannel() {
    if ('serviceWorker' in navigator) {
        run().catch(error => console.error(error));
    }
    else {
        alert('Your browser does not support service workers or you not visiting this site via a secured https connection or in private mode. Unfortunately, service workers are required to implement background notifications. Please ensure you are using https, are not using incognito mode. If this does not solve the problem, please try another browser.');
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

    const letters = /^[0-9a-zA-Z]+$/;
    if (!channelname.match(letters)) {
        alert('Name contains illegal characters, only a-Z and 0-9 are allowed!');
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

    if (channelname === '' || channelname === null || typeof channelname === 'undefined') {
        alert('Please enter a channel name!');
        return;
    }
    const letters = /^[0-9a-zA-Z]+$/;
    if (!channelname.match(letters)) {
        alert('Name contains illegal characters, only a-Z and 0-9 are allowed!');
        return;
    }
    if (clientToken === '' || clientToken === null || typeof clientToken === 'undefined') {
        alert('Something went wrong when initializing the client (no client token set). Please refresh this site and try again.');
        return;
    }

    document.getElementById("subscribebutton").disabled = true;
    document.getElementById("subscribebutton").innerText = 'Working on it...';

    var subscription = {
        ChannelName: channelname,
        ClientToken: clientToken,
        ChannelSubscriptionSecret: subscriptionsecret
    };

    var labelobject = document.getElementById('subscribe_feedbackalert');
    var labelobjectclass = "alert alert-danger";
    
    console.log('Publishing subscription...');

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
                if (cookie === null || typeof cookie === 'undefined' || cookie === '') {
                    console.log('No cookie found, creating new one...');
                    var newCookie = [clientToken, responseJson.SubscriptionToken];
                    var newCookieStringified = JSON.stringify(newCookie);
                    setCookie(cookieName, newCookieStringified, 1825);
                }
                else {
                    console.log('Cookie found, adding the new token to it...');
                    var oldSubscriptionTokens = JSON.parse(cookie);

                    if (responseJson.SubscriptionToken !== null && typeof responseJson.SubscriptionToken !== 'undefined' && responseJson.SubscriptionToken !== '') {
                        var newTokenIsAlreadyInList = (oldSubscriptionTokens.indexOf(responseJson.SubscriptionToken) > 0);
                        if (!newTokenIsAlreadyInList) {
                            console.log('Token is indeed new and no duplicate subscription...');
                            oldSubscriptionTokens.push(responseJson.SubscriptionToken);
                        }
                    }
                    else {
                        console.log('Token is null or empty -> will not be persisted.');
                    }
                    
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


function initialize() {
    if ('Notification' in window && navigator.serviceWorker) {
        Notification.requestPermission().then(function (result) {
            if (result === 'denied') {
                console.log('Permission wasn\'t granted. Allow a retry.');
                document.getElementById("nopushsupportwarning").innerText = "You have to authorize this site to send you push notifications, if you want to receive them.";
                document.getElementById("nopushsupportwarning").className = "alert alert-dark";
                document.getElementById("apiupdatespinner").style.display = 'none';
                return;
            }
            if (result === 'default') {
                console.log('The permission request was dismissed.');
                document.getElementById("nopushsupportwarning").innerText = "You have to authorize this site to send you push notifications, if you want to receive them.";
                document.getElementById("nopushsupportwarning").className = "alert alert-dark";
                document.getElementById("apiupdatespinner").style.display = 'none';
                return;
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(() => {
                    console.log('Service worker is ready, beginning to perfom init.');
                    updateExistingEndpoints();
                });

                setTimeout(function () {
                    console.log('Timeout expired, registering push now, whether the service worker is ready or not...');
                    updateExistingEndpoints();
                }, 10000);
            }
            else {
                document.getElementById("nopushsupportwarning").innerText = "Either you are visiting this site via an unsecure http connection, in incognito mode, or your browser does not support service workers (which are required to receive push notifications). Please ensure you are using https and you are currently not using incognito mode. If this does not solve your problem, please consider using another browser.";
                document.getElementById("nopushsupportwarning").className = "alert alert-dark";
                document.getElementById("apiupdatespinner").style.display = 'none';
            }
        });
    }
    else {
        console.log('Browser does not support notifications.');
        document.getElementById("nopushsupportwarning").innerText = "Either you are visiting this site via an unsecure http connection, in incognito mode, or your browser does not support service workers (which are required to receive push notifications). Please ensure you are using https and you are currently not using incognito mode. If this does not solve your problem, please consider using another browser.";
        document.getElementById("nopushsupportwarning").className = "alert alert-dark";
        document.getElementById("apiupdatespinner").style.display = 'none';
    }
}

var clientToken = '';
var existingEndpointsUpdated = false;
async function updateExistingEndpoints() {
    if (existingEndpointsUpdated) {
        console.log('Init already done, skipping.');
        return;        
    }    

    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.
        register('https://PIPELINE_INSERT_APP_URL/public/worker.js', { scope: '/post2push/public/' });

    console.log('Registering push...');
    var deliveryDetails = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    existingEndpointsUpdated = true;
    console.log('Push registered. Init considered to be done.');

    var cookie = getCookie(cookieName);
    var registerEndpointTargetUrl = 'https://PIPELINE_INSERT_APP_URL/clients/';
    var payload = {
        DeliveryDetails: deliveryDetails
    };

    if (typeof cookie === 'undefined' || cookie === null || cookie == '') {        
        console.log('No cookie detected -> endpoint needs to be registered.');

        fetch(registerEndpointTargetUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'content-type': 'application/json'
            }
        }).then((response) => {
            response.text().then((text) => {
                console.log('Response: ' + text);
                var tokensList;
                if (response.ok) {
                    var responseJson = JSON.parse(text);
                    tokensList = [responseJson.ClientToken];
                    clientToken = responseJson.ClientToken;
                    document.getElementById("subscribebutton").disabled = false;
                    document.getElementById("apiupdatespinner").style.display = 'none';
                }
                else {
                    document.getElementById("nopushsupportwarning").innerText = "Something went wrong while sending the client data to the post2push api, please try again: " + text;
                    document.getElementById("nopushsupportwarning").className = "alert alert-danger";
                    document.getElementById("apiupdatespinner").style.display = 'none';
                }
                var tokensListStringified = JSON.stringify(tokensList);
                setCookie(cookieName, tokensListStringified, 1825);
                console.log('Token list ' + tokensList + 'persisted in cookie, init completed.');
            });
        });

        return;
    }

    var tokensList = JSON.parse(cookie); //Um Kompatibilität bei Migration zu wahren: 1. Token ist Client-Token, alle folgenden sind Subscription-Tokens

    if (tokensList === null || typeof tokensList === 'undefined' || tokensList.length === 0) {
        console.log('No tokens in cookie ' + clientTokens.length + ' -> endpoint needs to be registered.');

        fetch(registerEndpointTargetUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'content-type': 'application/json'
            }
        }).then((response) => {
            response.text().then((text) => {
                console.log('Response: ' + text);
                if (response.ok) {
                    var responseJson = JSON.parse(text);
                    tokensList = [responseJson.ClientToken];
                    clientToken = responseJson.ClientToken;
                    document.getElementById("subscribebutton").disabled = false;
                    document.getElementById("apiupdatespinner").style.display = 'none';
                }
                else {
                    document.getElementById("nopushsupportwarning").innerText = "Something went wrong while sending the client data to the post2push api, please try again: " + text;
                    document.getElementById("nopushsupportwarning").className = "alert alert-danger";
                    document.getElementById("apiupdatespinner").style.display = 'none';
                }
                var tokensListStringified = JSON.stringify(tokensList);
                setCookie(cookieName, tokensListStringified, 1825);
                console.log('Token list ' + tokensList + 'persisted in cookie, init completed.');
            });
        });
        return;
    }
    console.log('Found ' + tokensList.length + ' tokens (first of them is the client token) -> updating endpoint...');

    clientToken = tokensList[0];
    console.log('Client token is ' + clientToken);

    var updateEndpointTargetUrl = 'https://PIPELINE_INSERT_APP_URL/clients/' + clientToken;

    fetch(updateEndpointTargetUrl, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        if (res.status === '404' || res.status === 404) {
            console.log('Server is not aware of client token; resetting cookie and registering new endpoint.');
            tokensList = [];

            fetch(registerEndpointTargetUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json'
                }
            }).then((response) => {
                response.text().then((text) => {
                    console.log('Response: ' + text);
                    if (response.ok) {
                        var responseJson = JSON.parse(text);
                        tokensList = [responseJson.ClientToken];
                        clientToken = responseJson.ClientToken;
                        document.getElementById("subscribebutton").disabled = false;
                        document.getElementById("apiupdatespinner").style.display = 'none';    
                    }
                    else {
                        document.getElementById("nopushsupportwarning").innerText = "Something went wrong while sending the client data to the post2push api, please try again: " + text;
                        document.getElementById("nopushsupportwarning").className = "alert alert-danger";
                        document.getElementById("apiupdatespinner").style.display = 'none';
                    }
                    var tokensListStringified = JSON.stringify(tokensList);
                    setCookie(cookieName, tokensListStringified, 1825);
                    console.log('Token list ' + tokensList + ' persisted, init complete.');
                });
            });
        }
        else {
            res.text().then((text) => {
                document.getElementById("subscribebutton").disabled = false;
                document.getElementById("apiupdatespinner").style.display = 'none';
                console.log('Endpoint for client token ' + clientToken + ' updated: ' + text);

                console.log('List of locally stored subscription tokens:');
                tokensList.forEach(function (token) {
                    if (token !== 'null' && token !== null && typeof token !== 'undefined' && token !== '' && token !== clientToken) {                        
                        console.log(token);
                    }
                });
                console.log('Init complete.');
            });
        }
    });
}

window.addEventListener('load', function () {
    initialize();
})

async function posttochannel() {
    var channelname = document.getElementById('post_channelnameinput').value;
    var postsecret = document.getElementById('post_channelpushsecret').value;
    var messagetitle = document.getElementById('post_messagetitle').value;
    var messagecontent = document.getElementById('post_messagecontent').value;
    var messageispersistent = document.getElementById('post_ispersistent').checked;
    var messagelink = document.getElementById('post_messagelink').value;

    if (channelname === '' || channelname === null || typeof channelname === 'undefined') {
        alert('Please enter a channel name!');        
        return;
    }

    if (postsecret === '' || postsecret === null || typeof postsecret === 'undefined') {
        alert('Please enter the channel creation secret!');
        return;
    }

    if (messagetitle === '' || messagetitle === null || typeof messagetitle === 'undefined') {
        alert('Please enter a message title!');
        return;
    }

    if (messagecontent === '' || messagecontent === null || typeof messagecontent === 'undefined') {
        alert('Please enter the message content!');
        return;
    }

    const letters = /^[0-9a-zA-Z]+$/;
    if (!channelname.match(letters)) {        
        alert('Name contains illegal characters, only a-Z and 0-9 are allowed!');
        return;
    }

    document.getElementById("posttochannelbutton").disabled = true;
    document.getElementById("posttochannelbutton").innerText = 'Working on it...';

    var payload = {
        PushSecret: postsecret,
        MessageTitle: messagetitle,
        MessageContent: messagecontent,
        MessageIsPersistent: messageispersistent
    };

    if (messagelink !== '' && messagelink !== null && typeof messagelink !== 'undefined') {
        payload.ActionUrl = messagelink;
    }

    var alertClassName = "alert alert-danger";
    var posturl = 'https://PIPELINE_INSERT_APP_URL/channels/' + channelname + '/push';
    await fetch(posturl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'content-type': 'application/json'
        }
    }).then((res) => {
        res.text().then((text) => {
            document.getElementById("posttochannelbutton").disabled = false;
            document.getElementById("posttochannelbutton").innerText = 'Post';
            if (res.ok) {
                alertClassName = "alert alert-success";
            }
            else {
                alertClassName = "alert alert-danger";
            }
            var labelobject = document.getElementById('post_feedbackalert');
            labelobject.innerText = text;
            labelobject.className = alertClassName;
            labelobject.removeAttribute("hidden");
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