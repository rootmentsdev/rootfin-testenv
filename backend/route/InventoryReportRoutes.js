import express from "express";
import {
  getInventorySummary,
  getStockSummary,
  getInventoryValuation,
  getInventoryAging,
  getOpeningStockReport,
  getStockOnHandReport,
  getInTransitStockReport
} from "../controllers/InventoryReportController.js";

const router = express.Router();

router.get("/summary", getInventorySummary);
router.get("/stock-summary", getStockSummary);
router.get("/valuation", getInventoryValuation);
router.get("/aging", getInventoryAging);
router.get("/opening-stock", getOpeningStockReport);
router.get("/stock-on-hand", getStockOnHandReport);
router.get("/in-transit-stock", getInTransitStockReport);

export default router;
