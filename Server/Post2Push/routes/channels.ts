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
    res.status(405).json({ 'Error': 'DELETE not allowed.' }).end();
    return;
});

router.get('/', (req: any, res: express.Response) => {
    res.status(405).json({ 'Error': 'Not supported.' }).end();
    return;
});

router.post('/', (req: any, res: express.Response) => {
    var type = req.headers['content-type'];

    if (type !== 'application/json') {
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }

    if (req.body.Name === null || typeof req.body.Name === 'undefined') {
        res.status(400).json({ 'Error': 'Missing desired Name' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
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
            if (req.body.IconUrl.length > 100) {
                res.status(400).json({ 'Error': 'Maximum supported length for icon URLs is 100 characters' }).end();
                return;
            }

            createChannelQuery = 'INSERT INTO channel (name, push_secret, icon_url) VALUES (?,?,?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.IconUrl]);
        }

    }
    else {
        if (req.body.SubscriptionSecret.length > 40) {
            res.status(400).json({ 'Error': 'Maximum supported length for subscription secret is 40 characters' }).end();
            return;
        }

        if (req.body.IconUrl === null || typeof req.body.IconUrl === 'undefined') {
            createChannelQuery = 'INSERT INTO channel (name, push_secret, subscription_secret) VALUES (?, ?, ?)';
            createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.SubscriptionSecret]);
        }
        else {
            if (req.body.IconUrl.length > 100) {
                res.status(400).json({ 'Error': 'Maximum supported length for icon URLs is 100 characters' }).end();
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
    var type = req.headers['content-type'];

    if (type !== 'application/json') {
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }

    if (req.params.name === null || typeof req.params.name === 'undefined') {
        res.status(400).json({ 'Error': 'Missing name' }).end();
        return;
    }
    if (req.body.MessageContent === null || typeof req.body.MessageContent === 'undefined') {
        res.status(400).json({ 'Error': 'Missing MessageContent' }).end();
        return;
    }
    if (req.body.MessageTitle === null || typeof req.body.MessageTitle === 'undefined') {
        res.status(400).json({ 'Error': 'Missing MessageTitle' }).end();
        return;
    }
    if (req.body.PushSecret === null || typeof req.body.PushSecret === 'undefined') {
        res.status(401).json({ 'Error': 'Missing PushSecret' }).end();
        return;
    }

    var getAffectedChannelQuery = 'SELECT name, push_secret, icon_url FROM channel WHERE name = ?';
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
            res.status(401).json({ 'Error': 'Invalid PushSecret' }).end();
            return;
        }

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
                res.status(401).json({ 'Error': 'Invalid PushSecret' }).end();
                return;
            }

            var getReceiversQuery = 'SELECT token, delivery_details FROM subscription WHERE channel_name = ?';
            getReceiversQuery = mysql.format(getReceiversQuery, req.params.name);

            req.connection.query(getReceiversQuery, function (err, receiverRows) {
                req.connection.release();
                if (err) {                    
                    res.status(500).json({ 'Error': 'Unknown database error' }).end();
                    return;
                }

                var payload;
                if (channelRows[0].icon_url === null || typeof channelRows[0].icon_url === 'undefined') {
                    payload = JSON.stringify({ title: req.body.MessageTitle, body: req.body.MessageContent });
                }
                else {
                    payload = JSON.stringify({ title: req.body.MessageTitle, body: req.body.MessageContent, icon: channelRows[0].icon_url });
                }

                var errorsCounter = 0;
                var index;
                for (index = 0; index < receiverRows.length; index++) {
                    var receiverData = JSON.parse(receiverRows[index].delivery_details);
                    webpush.sendNotification(receiverData, payload).catch(error => {
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
    res.status(405).json({ 'Error': 'GET not allowed.' }).end();
    return;
});

router.delete('/:name/push', (req: any, res: express.Response) => {
    res.status(405).json({ 'Error': 'DELETE not allowed.' }).end();
    return;
});

router.delete('/:name', (req: any, res: express.Response) => {
    if (req.params.name === null || typeof req.params.name === 'undefined') {
        res.status(400).json({ 'Error': 'Missing name' }).end();
        return;
    }

    var query = 'DELETE FROM channel WHERE name = ?';
    query = mysql.format(query, req.params.token);

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
    return;
});

router.get('/:name', (req: any, res: express.Response) => {
    res.status(501).json({ 'Error': 'Not supported.' }).end();
    return;
});

router.post('/:name', (req: any, res: express.Response) => {
    res.status(405).json({ 'Error': 'POST not allowed.' }).end();
    return;
});

export default router;