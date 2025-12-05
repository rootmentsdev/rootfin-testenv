import express from "express";
import {
  createInventoryAdjustment,
  getInventoryAdjustments,
  getInventoryAdjustmentById,
  updateInventoryAdjustment,
  deleteInventoryAdjustment,
  getItemStock,
} from "../controllers/InventoryAdjustmentController.js";

const router = express.Router();

router
  .route("/inventory/adjustments")
  .get(getInventoryAdjustments)
  .post(createInventoryAdjustment);

router
  .route("/inventory/adjustments/:id")
  .get(getInventoryAdjustmentById)
  .put(updateInventoryAdjustment)
  .delete(deleteInventoryAdjustment);

router
  .route("/inventory/adjustments/stock/item")
  .get(getItemStock);

export default router;


