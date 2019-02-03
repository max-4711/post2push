﻿/*
 * /subscriptions/...
 */
import express = require('express');
import TokenGenerator = require('../helpers/tokengenerator');
import AppConfiguration = require('../config/app.config');
import webpush = require('web-push');

const mysql = require('mysql');
const tokenGenerator = new TokenGenerator();
const router = express.Router();
const appConfig = new AppConfiguration();

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
    res.status(405).json({ 'Error': 'GET not allowed.' }).end();
    return;
});

router.post('/', (req: any, res: express.Response) => {
    var type = req.headers['content-type'];

    if (type !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }

    if (req.body.ChannelName === null || typeof req.body.ChannelName === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing ChannelName' }).end();
        return;
    }
    if (req.body.DeliveryDetails === null || typeof req.body.DeliveryDetails === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing DeliveryDetails' }).end();
        return;
    }

    var deliveryDetailsStringified = JSON.stringify(req.body.DeliveryDetails);

    var getSubcriptionClonesQuery = 'SELECT token, name FROM subscription WHERE channel_name = ? AND delivery_details = ?';
    getSubcriptionClonesQuery = mysql.format(getSubcriptionClonesQuery, [req.body.ChannelName, deliveryDetailsStringified]);

    const iconurl = 'https://' + appConfig.applicationUrl + '/public/success.png'

    req.connection.query(getSubcriptionClonesQuery, function (err, subscriptionRows) {
        if (err) {
            req.connection.release();
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (subscriptionRows.length !== 0) {
            req.connection.release();
            res.status(200).json({ 'Message': 'Subscription already present!', 'SubscriptionToken': subscriptionRows[0].token }).end();

            var payload = JSON.stringify({ title: 'Pling!', body: 'Es funktioniert. Wirklich.', icon: iconurl });
            webpush.sendNotification(req.body.DeliveryDetails, payload).catch(error => {
                console.error('Error while sending push notification: ' + error.stack);
            })
            return;
        }

        var getAffectedChannelQuery = 'SELECT name, subscription_secret FROM channel WHERE name = ?';
        getAffectedChannelQuery = mysql.format(getAffectedChannelQuery, req.body.ChannelName);

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

            if (channelRows[0].subscription_secret !== null && channelRows[0].subscription_secret !== '' && typeof channelRows[0].subscription_secret !== 'undefined') {
                if (channelRows[0].subscription_secret !== req.body.ChannelSubscriptionSecret) {
                    req.connection.release();
                    res.status(401).json({ 'Error': 'Invalid ChannelSubscriptionSecret' }).end();
                    return;
                }
            }

            let subscriptionToken = tokenGenerator.Generate(45);
            var createSubscriptionQuery = '';        

            if (req.body.Name === null || typeof req.body.Name === 'undefined') {
                createSubscriptionQuery = "INSERT INTO subscription (token, channel_name, delivery_details) VALUES (?, ?, ?)";
                createSubscriptionQuery = mysql.format(createSubscriptionQuery, [subscriptionToken, req.body.ChannelName, deliveryDetailsStringified]);
            }
            else {
                if (req.body.Name.length > 50) {
                    req.connection.release();
                    res.status(400).json({ 'Error': 'Maximum supported length for subscription name is 50 characters' }).end();
                    return;
                }

                createSubscriptionQuery = 'INSERT INTO subscription (token, channel_name, name, delivery_details) VALUES (?, ?, ?, ?)';
                createSubscriptionQuery = mysql.format(createSubscriptionQuery, [subscriptionToken, req.body.ChannelName, req.body.Name, deliveryDetailsStringified]);
            }

            var query = req.connection.query(createSubscriptionQuery, function (err, result) {
                req.connection.release();

                if (err) {
                    res.status(500).json({ 'Error': 'Unknown database error' }).end();
                    return;
                }
                if (result.affectedRows === 0) {
                    res.status(400).json({ 'Error': 'Unable to create subscription' }).end();
                    return;
                }

                res.status(201).json({ 'Message': 'Subscription created', 'SubscriptionToken': subscriptionToken }).end();

                var payload = JSON.stringify({ title: 'Pling!', body: 'Es funktioniert.', icon: iconurl });
                webpush.sendNotification(req.body.DeliveryDetails, payload).catch(error => {
                    console.error('Error while sending push notification: ' + error.stack);
                })
            });
        });
    });
});

router.post('/:token', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(501).json({ 'Error': 'POST not allowed.' }).end();
    return;
});

router.get('/:token', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'GET not allowed.' }).end();
    return;
});

router.delete('/:token', (req: any, res: express.Response) => {
    if (req.params.token === null || typeof req.params.token === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing subscription token' }).end();
        return;
    }

    var query = 'DELETE FROM subscription WHERE token = ?';
    query = mysql.format(query, req.params.token);

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (result.affectedRows === 0) {
            res.status(410).json({ 'Error': 'Unable to delete subscription, because it is already deleted' });
            return;
        }

        res.status(200).json({ 'Message': 'Subscription successfully deleted.' });
    });
});

router.put('/:token', (req: any, res: express.Response) => {
    var type = req.headers['content-type'];
    if (type !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }
    if (req.params.token === null || typeof req.params.token === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing subscription token' }).end();
        return;
    }
    if (req.body.DeliveryDetails === null || typeof req.body.DeliveryDetails === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing DeliveryDetails' }).end();
        return;
    }

    var deliveryDetailsStringified = JSON.stringify(req.body.DeliveryDetails);

    var query = 'UPDATE subscription SET delivery_details = ? WHERE token = ?';
    query = mysql.format(query, [deliveryDetailsStringified, req.params.token]);

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ 'Error': 'No subscription with this token present.' });
            return;
        }

        res.status(200).json({ 'Message': 'Subscription successfully updated.' });
    });
});

export default router;