/*
 * GET route
 */
import express = require('express');
const router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {
    res.status(200).json({ 'Message': 'post2push api available.' }).end();
});

router.post('/', (req: express.Request, res: express.Response) => {
    res.status(405).json({ 'Error': 'POST not allowed' }).end();
});

router.delete('/', (req: express.Request, res: express.Response) => {
    res.status(405).json({ 'Message': 'DELETE not allowed' }).end();
});

export default router;