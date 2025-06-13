import express from 'express';
import { saveOverride,getOverrides } from '../controllers/OverrideTransactionController.js';

const router = express.Router();

router.post('/:invoiceNo', saveOverride);
router.get('/', getOverrides);

export default router;
