import express from "express";
import {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
} from "../controllers/BillController.js";

const router = express.Router();

router
  .route("/purchase/bills")
  .get(getBills)
  .post(createBill);

router
  .route("/purchase/bills/:id")
  .get(getBillById)
  .put(updateBill)
  .delete(deleteBill);

export default router;

