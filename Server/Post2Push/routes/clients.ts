/*
 * /channels/...
 */
import express = require('express');
import TokenGenerator = require('../helpers/tokengenerator');
import AppConfiguration = require('../config/app.config');

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
    var type = req.headers['content-type'];
    if (type !== 'application/json') {
        req.connection.release();
        res.status(406).json({ 'Error': 'Only type application/json supported' }).end();
        return;
    }

    if (req.body.DeliveryDetails === null || typeof req.body.DeliveryDetails === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing DeliveryDetails' }).end();
        return;
    }

    var deliveryDetailsStringified = JSON.stringify(req.body.DeliveryDetails);
    let clientToken = tokenGenerator.Generate(45);

    var createClientQuery = '';
    if (req.body.Name === null || typeof req.body.Name === 'undefined') {        
        createClientQuery = 'INSERT INTO client (token, delivery_details, delivery_details_hash) VALUES (?,?, SHA2(?, 256))';
        createClientQuery = mysql.format(createClientQuery, [clientToken, deliveryDetailsStringified, deliveryDetailsStringified]);
    }
    else {
        if (req.body.Name.length > 50) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Maximum supported length for Name is 50 characters' }).end();
            return;
        }

        createClientQuery = 'INSERT INTO client (token, name, delivery_details, delivery_details_hash) VALUES (?, ?, ?, SHA2(?, 256))';
        createClientQuery = mysql.format(createClientQuery, [clientToken, req.body.Name, deliveryDetailsStringified, deliveryDetailsStringified]);
    }

    req.connection.query(createClientQuery, function (err, result) {

        if (err) {
            if (err.errno === 1062 || err.errno === 1586) { //Unique constraint (oder primary key, aber wie wahrscheinlich ist das bitte...) verletzt
                let getExistingClientQuery = 'SELECT token FROM client WHERE delivery_details_hash = SHA2(?, 256)';
                getExistingClientQuery = mysql.format(getExistingClientQuery, deliveryDetailsStringified);

                req.connection.query(getExistingClientQuery, function (err, selectionResult) {
                    req.connection.release();

                    if (err) {
                        res.status(500).json({ 'Error': 'Unknown database error.', 'Message': 'Client already existing (this is not causing the error).' }).end();
                        return;
                    }
                    if (selectionResult.length === 0) {
                        res.status(500).json({ 'Error': 'Unknown database error', 'Message': 'Client already existing (this is not causing the error).' }).end();
                        return;
                    }

                    res.status(200).json({ 'Message': 'Client already existing.', 'ClientToken': selectionResult[0].token }).end();
                    return;
                });
            }
            else {
                req.connection.release();
                res.status(500).json({ 'Error': 'Unknown database error' }).end();
                return;
            }
        }
        else {
            req.connection.release();

            if (result.affectedRows === 0) {                
                res.status(400).json({ 'Error': 'Unable to create client' }).end();
                return;
            }

            res.status(201).json({ 'Message': 'Client created.', 'ClientToken': clientToken }).end();
            return;
        }
    });
});

router.delete('/:token', (req: any, res: express.Response) => {
    if (req.params.token === null || typeof req.params.token === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing token' }).end();
        return;
    }

    var query = 'DELETE FROM client WHERE token = ?';
    query = mysql.format(query, req.params.token);

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        if (result.affectedRows === 0) {
            res.status(410).json({ 'Error': 'Unable to delete client because it is already deleted' });
            return;
        }

        res.status(200).json({ 'Message': 'Client successfully deleted.' });
    });
});

router.get('/:token', (req: any, res: express.Response) => {
    if (req.params.token === null || typeof req.params.token === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing token' }).end();
        return;
    }

    let query = 'SELECT token FROM subscription WHERE client_token = ?';
    query = mysql.format(query, req.params.token);

    req.connection.query(query, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }

        let subscriptionTokens = result.map(x => x.token);
        let resultObject = {
            Subscriptions: subscriptionTokens
        };

        res.status(200).json(resultObject);
    });
});

router.post('/:token', (req: any, res: express.Response) => {
    req.connection.release();
    res.status(405).json({ 'Error': 'POST not allowed.' }).end();
    return;
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
        res.status(400).json({ 'Error': 'Missing token' }).end();
        return;
    }
    if (req.body.DeliveryDetails === null || typeof req.body.DeliveryDetails === 'undefined') {
        req.connection.release();
        res.status(400).json({ 'Error': 'Missing DeliveryDetails' }).end();
        return;
    }

    var deliveryDetailsStringified = JSON.stringify(req.body.DeliveryDetails);

    var updateClientQuery;
    if (req.body.Name !== null && typeof req.body.Name !== 'undefined') {
        if (req.body.Name.length > 50) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Maximum supported length for Name is 50 characters' }).end();
            return;
        }

        updateClientQuery = 'UPDATE client SET delivery_details = ?, delivery_details_hash = SHA2(?, 256), Name = ? WHERE token = ?';
        updateClientQuery = mysql.format(updateClientQuery, [deliveryDetailsStringified, deliveryDetailsStringified, req.body.Name, req.params.token]);
    }
    else {
        updateClientQuery = 'UPDATE client SET delivery_details = ?, delivery_details_hash = SHA2(?, 256) WHERE token = ?';
        updateClientQuery = mysql.format(updateClientQuery, [deliveryDetailsStringified, deliveryDetailsStringified, req.params.token]);    
    }

    req.connection.query(updateClientQuery, function (err, result) {
        req.connection.release();

        if (err) {
            if (err.errno === 1062 || err.errno === 1586) {
                res.status(409).json({ 'Error': 'Delivery details conflict with other client; register new one.' }).end(); 
            }
            else {
                res.status(500).json({ 'Error': 'Unknown database error' }).end();                
            }
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ 'Error': 'No client with this token present.' });
            return;
        }

        res.status(200).json({ 'Message': 'Client successfully updated.' });
    });
});

export default router;