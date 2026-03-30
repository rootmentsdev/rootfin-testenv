import express from "express";
import { getEditedTransactions } from "../controllers/EditController.js";
import { getsaveCashBank } from "../controllers/EditController.js";
import {
  requestEdit,
  getPendingEditRequests,
  approveEditRequest,
  rejectEditRequest,
} from "../controllers/EditRequestController.js";

const router = express.Router();

router.get("/getEditedTransactions", getEditedTransactions);
router.get("/getsaveCashBank", getsaveCashBank);

// Edit approval flow
router.post("/editRequest", requestEdit);
router.get("/editRequests", getPendingEditRequests);
router.put("/editRequest/:id/approve", approveEditRequest);
router.put("/editRequest/:id/reject", rejectEditRequest);

export default router;
