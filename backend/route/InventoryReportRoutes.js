import express from "express";
import {
  getInventorySummary,
  getStockSummary,
  getInventoryValuation,
  getInventoryAging
} from "../controllers/InventoryReportController.js";

const router = express.Router();

router.get("/summary", getInventorySummary);
router.get("/stock-summary", getStockSummary);
router.get("/valuation", getInventoryValuation);
router.get("/aging", getInventoryAging);

export default router;
