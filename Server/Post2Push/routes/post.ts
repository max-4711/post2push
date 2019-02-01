/*
 * POST routes
 */
import Express = require('express');
import TokenGenerator = require('../helpers/tokengenerator');
import AppConfiguration = require('../config/app.config');

const mysql = require('mysql');
const tokenGenerator = new TokenGenerator();
const appConfig = new AppConfiguration();
const router = Express.Router();

const middleware = {
    getDbConnection: require('../middleware/getDbConnection')
};
router.use(middleware.getDbConnection);


router.post('/create', (req, res: Express.Response) => {
    var type = req.headers['content-type'];

    if (type !== 'application/json') {
        res.status(406).end();
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
        createChannelQuery = 'INSERT INTO channel (name, push_secret) VALUES (?,?)';
        createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret]);
    }
    else {
        createChannelQuery = 'INSERT INTO channel (name, push_secret, subscription_secret) VALUES (?, ?, ?)';
        createChannelQuery = mysql.format(createChannelQuery, [req.body.Name, pushSecret, req.body.SubscriptionSecret]);
    }
});

router.post('/subscribe', (req: Express.Request, res: Express.Response) => {
    res.send("TODO");
});

router.post('/push', (req: Express.Request, res: Express.Response) => {
    res.send("TODO");
});

export default router;