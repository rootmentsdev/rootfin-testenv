// routes/twsRoutes.js
import express from 'express';
import { getTwsTransactions, triggerTwsSync } from '../controllers/TwsControllers.js';

const router = express.Router();

router.get('/sync-tws', triggerTwsSync);
router.get('/get-tws', getTwsTransactions);

export default router;

