import express from 'express';
import {
  createApproval,
  getApprovals,
  reviewApproval,
  getPendingCount,
} from '../controllers/ApprovalController.js';

const router = express.Router();

router.post('/', createApproval);
router.get('/', getApprovals);
router.get('/pending-count', getPendingCount);
router.put('/:id/review', reviewApproval);

export default router;
