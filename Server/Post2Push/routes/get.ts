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

router.get('/', (req: express.Request, res: express.Response) => {
    res.status(200).json({ 'Message': 'post2push api operational.' }).end();
});

router.post('/', (req: express.Request, res: express.Response) => {
    res.status(405).json({ 'Error': 'POST not allowed' }).end();
});

router.delete('/', (req: any, res: express.Response) => {
    if (req.body.ChannelCreationSecret === null || typeof req.body.ChannelCreationSecret === 'undefined') {
        res.status(401).json({ 'Error': 'Missing ChannelCreationSecret' }).end();
        return;
    }
    if (req.body.ChannelCreationSecret !== appConfig.channelcreationsecret) {
        res.status(401).json({ 'Error': 'Invalid ChannelCreationSecret' }).end();
        return;
    }

    var query = "DELETE FROM channel WHERE last_push_timestamp < (NOW() - INTERVAL 180 DAY) AND name <> 'TestChannel'";

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        let message = result.affectedRows + ' channels (and their subscriptions) not used for at least 180 days removed.'

        res.status(200).json({ 'Message': message });
    });
});

export default router;