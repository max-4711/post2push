/*
 * /channels/...
 */
import express = require('express');
import TokenGenerator = require('../helpers/tokengenerator');
import AppConfiguration = require('../config/app.config');
import webpush = require('web-push');

const mysql = require('mysql');
const tokenGenerator = new TokenGenerator();
const appConfig = new AppConfiguration();
const router = express.Router();

const middleware = {
    getDbConnection: require('../middleware/getDbConnection')
};
router.use(middleware.getDbConnection);

router.delete('/', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'DELETE not allowed.' }).end();
    return;
});

router.get('/', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'Not supported.' }).end();
    return;
});

router.post('/', (req: any, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }
    if (req.body.Name === null || typeof req.body.Name === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing desired Name' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        req.connection.release();
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        req.connection.release();
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.Name.length > 50) {
        req.connection.release();
        res.status(400).json({ 'Error': 'Maximum supported length for channel name is 50 characters' }).end();
        return;
    }
    const letters = /^[0-9a-zA-Z]+$/;
    if (!req.body.Name.match(letters)) {
        req.connection.release();
        res.status(403).json({ 'Error': 'Name contains illegal characters, only a-Z and 0-9 are allowed' }).end();
        return;
    }

    let pushSecret = tokenGenerator.Generate(50);

    var createChannelQuery = '';
    if (req.body.SubscriptionSecret === null || typeof req.body.SubscriptionSecret === 'undefined') {

        if (req.body.IconUrl === null || typeof req.body.IconUrl === 'undefined') {
            createChannelQuery = 'INSERT INTO channel (name, push_secret) VALUES (?,?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret]);
        }
        else {
            if (req.body.IconUrl.length > 200) {
                req.connection.release();
                res.status(400).json({ 'Error': 'Maximum supported length for icon URL is 200 characters' }).end();
                return;
            }

            createChannelQuery = 'INSERT INTO channel (name, push_secret, icon_url) VALUES (?,?,?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.IconUrl]);
        }

    }
    else {
        if (req.body.SubscriptionSecret.length > 40) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Maximum supported length for subscription secret is 40 characters' }).end();
            return;
        }

        if (req.body.IconUrl === null || typeof req.body.IconUrl === 'undefined') {
            createChannelQuery = 'INSERT INTO channel (name, push_secret, subscription_secret) VALUES (?, ?, ?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.SubscriptionSecret]);
        }
        else {
            if (req.body.IconUrl.length > 200) {
                req.connection.release();
                res.status(400).json({ 'Error': 'Maximum supported length for icon URL is 200 characters' }).end();
                return;
            }

            createChannelQuery = 'INSERT INTO channel (name, push_secret, subscription_secret, icon_url) VALUES (?, ?, ?, ?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.SubscriptionSecret, req.body.IconUrl]);
        }

    }

    req.connection.query(createChannelQuery, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }
        if (result.affectedRows === 0) {
            res.status(400).json({ 'Error': 'Unable to create channel' }).end();
            return;
        }

        res.status(201).json({ 'Message': 'Channel created.', 'PushSecret': pushSecret }).end();
        return;
    });
});

router.post('/:name/push', (req: any, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }
    if (req.params.name === null || typeof req.params.name === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing name' }).end();
        return;
    }
    if (req.body.MessageContent === null || typeof req.body.MessageContent === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing MessageContent' }).end();
        return;
    }
    if (req.body.MessageTitle === null || typeof req.body.MessageTitle === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing MessageTitle' }).end();
        return;
    }
    if (req.body.PushSecret === null || typeof req.body.PushSecret === 'undefined') {
        req.connection.release();
        res.status(401).json({ 'Error': 'Missing PushSecret' }).end();
        return;
    }

    var notificationIsPersistent = false;
    if (req.body.MessageIsPersistent !== null && typeof req.body.MessageIsPersistent !== 'undefined') {
        if (req.body.MessageIsPersistent || req.body.MessageIsPersistent === 'true') {
            notificationIsPersistent = true;
        }
    }

    let ttlMinutes = 4320; //3 Tage
    if (req.body.MessageTtl !== null && typeof req.body.MessageTtl === 'number') {
        if (req.body.MessageTtl > 0 && req.body.MessageTtl < 40321) { //Maximum: 28 Tage
            ttlMinutes = req.body.MessageTtl
        }
    }
    let ttlSeconds = ttlMinutes * 60;
    var pushOptions = {
        TTL: ttlSeconds
    }
    let currentTimestamp = Math.floor(Date.now());

    //1. Channel suchen
    var getAffectedChannelQuery = 'SELECT push_secret, icon_url FROM channel WHERE name = ?';
    getAffectedChannelQuery = mysql.format(getAffectedChannelQuery, req.params.name);
    req.connection.query(getAffectedChannelQuery, function (err, channelRows) {
        if (err) {
            req.connection.release();
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }
        if (channelRows.length === 0) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Channel not existing' }).end();
            return;
        }
        if (channelRows[0].push_secret !== req.body.PushSecret) {
            req.connection.release();
            res.status(401).json({ 'Error': 'Invalid PushSecret' }).end();
            return;
        }

        //2. Channel-Timestamp aktualisieren
        var updateChannelQuery = 'UPDATE channel SET last_push_timestamp = TIMESTAMP() WHERE name = ?';
        updateChannelQuery = mysql.format(updateChannelQuery, req.params.name);
        req.connection.query(getAffectedChannelQuery, function (err, channelRows) {
            if (err) {
                req.connection.release();
                res.status(500).json({ 'Error': 'Unknown database error' }).end();
                return;
            }
            if (channelRows.length === 0) {
                req.connection.release();
                res.status(400).json({ 'Error': 'Channel not existing' }).end();
                return;
            }
            if (channelRows[0].push_secret !== req.body.PushSecret) {
                req.connection.release();
                res.status(401).json({ 'Error': 'Invalid PushSecret' }).end();
                return;
            }

            //3. Betroffene Subscriptions/Clients ermitteln
            var getReceiversQuery = 'SELECT cl.delivery_details AS cl_delivery_details FROM client cl INNER JOIN subscription s ON cl.token = s.client_token WHERE s.channel_name = ?';
            getReceiversQuery = mysql.format(getReceiversQuery, req.params.name);
            req.connection.query(getReceiversQuery, function (err, receiverRows) {
                req.connection.release();
                if (err) {                    
                    res.status(500).json({ 'Error': 'Unknown database error' }).end();
                    return;
                }

                var payload;
                if (channelRows[0].icon_url === null || typeof channelRows[0].icon_url === 'undefined' || channelRows[0].icon_url === '') {
                    if (req.body.ActionUrl === null || typeof req.body.ActionUrl === 'undefined' || req.body.ActionUrl === '') {
                        payload = {
                            title: req.body.MessageTitle,
                            body: req.body.MessageContent,
                            timestamp: currentTimestamp,
                            requireInteraction: notificationIsPersistent
                        };
                    }
                    else {
                        payload = {
                            title: req.body.MessageTitle,
                            body: req.body.MessageContent,
                            timestamp: currentTimestamp,
                            requireInteraction: notificationIsPersistent,
                            actions: [
                                { action: req.body.ActionUrl, title: 'Details', icon: 'https://' + appConfig.applicationUrl + '/public/details.png' },
                                { action: 'dismiss', title: 'Schließen', icon: 'https://' + appConfig.applicationUrl + '/public/dismiss.png' }
                            ]
                        };
                    }
                }
                else {
                    if (req.body.ActionUrl === null || typeof req.body.ActionUrl === 'undefined' || req.body.ActionUrl === '') {
                        payload = {
                            title: req.body.MessageTitle,
                            body: req.body.MessageContent,
                            timestamp: currentTimestamp,
                            icon: channelRows[0].icon_url,
                            requireInteraction: notificationIsPersistent
                        };
                    }
                    else {
                        payload = {
                            title: req.body.MessageTitle,
                            body: req.body.MessageContent,
                            timestamp: currentTimestamp,
                            icon: channelRows[0].icon_url,
                            requireInteraction: notificationIsPersistent,
                            actions: [
                                { action: req.body.ActionUrl, title: 'Details', icon: 'https://' + appConfig.applicationUrl + '/public/details.png' },
                                { action: 'dismiss', title: 'Schließen', icon: 'https://' + appConfig.applicationUrl + '/public/dismiss.png' }
                            ]
                        };
                    }
                }
                var stringifiedPayload = JSON.stringify(payload);

                var errorsCounter = 0;
                var index;
                for (index = 0; index < receiverRows.length; index++) {
                    var receiverData = JSON.parse(receiverRows[index].cl_delivery_details);
                    webpush.sendNotification(receiverData, stringifiedPayload, pushOptions).catch(error => {
                        errorsCounter++;
                        console.error('Error while sending push notification: ' + error.stack);
                    })
                }

                var successfullySentCount = receiverRows.length - errorsCounter;
                res.status(200).json({ 'Message': 'Push notifications sent.', 'Errors': errorsCounter, 'Successful': successfullySentCount, 'Total': receiverRows.length }).end();
            });
        });
    });

    return;
});

router.get('/:name/push', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'GET not allowed.' }).end();
    return;
});

router.delete('/:name/push', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'DELETE not allowed.' }).end();
    return;
});

router.delete('/:name', (req: any, res: express.Response) => {
    if (req.params.name === null || typeof req.params.name === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing name' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        req.connection.release();
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        req.connection.release();
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
        return;
    }

    var query = 'DELETE FROM channel WHERE name = ?';
    query = mysql.format(query, req.params.name);

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (result.affectedRows === 0) {
            res.status(410).json({ 'Error': 'Unable to delete channel, because it is already deleted' });
            return;
        }

        res.status(200).json({ 'Message': 'Channel successfully deleted.' });
    });
});

router.get('/:name', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(501).json({ 'Error': 'Not supported.' }).end();
    return;
});

router.post('/:name', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'POST not allowed.' }).end();
    return;
});

router.put('/:name', (req: any, res: express.Response) => {
    var type = req.headers['content-type'];
    if (type !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }
    if (req.params.name === null || typeof req.params.name === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing name' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        req.connection.release();
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        req.connection.release();
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
        return;
    }

    var updateChannelQUery;
    if (req.body.IconUrl !== null && typeof req.body.IconUrl !== 'undefined') {
        if (req.body.IconUrl.length > 200) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Maximum supported length for IconUrl is 200 characters' }).end();
            return;
        }

        if (req.body.SubscriptionSecret !== null && typeof req.body.SubscriptionSecret !== 'undefined') {
            if (req.body.SubscriptionSecret.length > 40) {
                req.connection.release();
                res.status(400).json({ 'Error': 'Maximum supported length for SubscriptionSecret is 40 characters' }).end();
                return;
            }
            updateChannelQUery = 'UPDATE channel SET icon_url = ?, subscription_secret = ? WHERE name = ?';
            updateChannelQUery = mysql.format(updateChannelQUery, [req.body.IconUrl, req.body.SubscriptionSecret, req.params.name]);
        }
        else {
            updateChannelQUery = 'UPDATE channel SET icon_url = ?, subscription_secret = NULL WHERE name = ?';
            updateChannelQUery = mysql.format(updateChannelQUery, [req.body.IconUrl, req.params.name]);
        }
    }
    else {
        if (req.body.SubscriptionSecret !== null && typeof req.body.SubscriptionSecret !== 'undefined') {
            if (req.body.SubscriptionSecret.length > 40) {
                req.connection.release();
                res.status(400).json({ 'Error': 'Maximum supported length for SubscriptionSecret is 40 characters' }).end();
                return;
            }
            updateChannelQUery = 'UPDATE channel SET subscription_secret = ?, icon_url = NULL WHERE name = ?';
            updateChannelQUery = mysql.format(updateChannelQUery, [req.body.SubscriptionSecret, req.params.name]);
        }
        else {
            updateChannelQUery = 'UPDATE channel SET subscription_secret = NULL, icon_url = NULL WHERE name = ?';
            updateChannelQUery = mysql.format(updateChannelQUery, req.params.name);
        }
    }

    req.connection.query(updateChannelQUery, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ 'Error': 'No channel with this name present.' });
            return;
        }

        res.status(200).json({ 'Message': 'Channel successfully updated.' });
    });
});

export default router;