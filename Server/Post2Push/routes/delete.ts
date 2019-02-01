/*
 * DELETE routes
 */
import express = require('express');
import mysql = require('mysql');
const router = express.Router();

const middleware = {
    getDbConnection: require('../middleware/getDbConnection')
};
router.use(middleware.getDbConnection);

router.delete('/subscription', (req: express.Request, res: express.Response) => {
    res.send("TODO");
});

router.delete('/channel', (req: express.Request, res: express.Response) => {
    res.send("TODO");
});

export default router;