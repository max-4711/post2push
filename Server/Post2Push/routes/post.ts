/*
 * POST routes
 */
import express = require('express');
const router = express.Router();

router.get('/create', (req: express.Request, res: express.Response) => {
    res.send("TODO");
});

router.get('/subscribe', (req: express.Request, res: express.Response) => {
    res.send("TODO");
});

router.get('/push', (req: express.Request, res: express.Response) => {
    res.send("TODO");
});

export default router;