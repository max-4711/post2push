/*
 * GET route
 */
import express = require('express');
import TokenGenerator = require('../helpers/tokengenerator');
import AppConfiguration = require('../config/app.config');

const mysql = require('mysql');
const router = express.Router();
const appConfig = new AppConfiguration();

const middleware = {
    getDbConnection: require('../middleware/getDbConnection')
};
router.use(middleware.getDbConnection);

router.get('/', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(200).json({ 'Message': 'post2push api operational.' }).end();
});

router.post('/', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'POST not allowed' }).end();
});

router.delete('/', (req: any, res: express.Response) => {
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        req.connection.release();
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
        req.connection.release();
        return;
    }

    var subscriptionsQuery = "DELETE FROM subscription WHERE modification_timestamp < (NOW() - INTERVAL 1095 DAY) OR channel_name = 'TestChannel'";

    req.connection.query(subscriptionsQuery, function (err, subscriptionsResult) { 
        if (err) {
            req.connection.release();
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        var channelsQuery = "DELETE FROM channel WHERE last_push_timestamp < (NOW() - INTERVAL 365 DAY) AND name <> 'TestChannel'";

        req.connection.query(channelsQuery, function (err, channelsResult) {
            req.connection.release();

            if (err) {
                res.status(500).json({ 'Error': 'Unknown database error' }).end();
                return;
            }

            let totalAffectedRows = subscriptionsResult.affectedRows + channelsResult.affectedRows;
            let message = totalAffectedRows + ' database rows purged.'

            res.status(200).json({ 'Message': message });
        });
    });
});

export default router;