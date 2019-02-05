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
        createClientQuery = 'INSERT INTO client (token, delivery_details) VALUES (?,?)';
        createClientQuery = mysql.format(createClientQuery, [clientToken, deliveryDetailsStringified]);
    }
    else {
        if (req.body.Name.length > 50) {
            req.connection.release();
            res.status(400).json({ 'Error': 'Maximum supported length for Name is 50 characters' }).end();
            return;
        }

        createClientQuery = 'INSERT INTO client (token, name, delivery_details) VALUES (?, ?, ?)';
        createClientQuery = mysql.format(createClientQuery, [clientToken, req.body.Name, deliveryDetailsStringified]);
    }

    req.connection.query(createClientQuery, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
            return;
        }
        if (result.affectedRows === 0) {
            res.status(400).json({ 'Error': 'Unable to create client' }).end();
            return;
        }

        res.status(201).json({ 'Message': 'Client created.', 'ClientToken': clientToken }).end();
        return;
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
    req.connection.release();
    res.status(501).json({ 'Error': 'Not supported.' }).end();
    return;
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

        updateClientQuery = 'UPDATE client SET delivery_details = ?, Name = ? WHERE token = ?';
        updateClientQuery = mysql.format(updateClientQuery, [deliveryDetailsStringified, req.body.Name, req.params.token]);
    }
    else {
        updateClientQuery = 'UPDATE client SET delivery_details = ? WHERE token = ?';
        updateClientQuery = mysql.format(updateClientQuery, [deliveryDetailsStringified, req.params.token]);    
    }

    req.connection.query(updateClientQuery, function (err, result) {
        req.connection.release();

        if (err) {
            res.status(500).json({ 'Error': 'Unknown database error' }).end();
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