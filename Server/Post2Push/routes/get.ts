/*
 * GET routes
 */
import express = require('express');
const router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {
    res.send("post2push&nbsp;available.");
});

export default router;