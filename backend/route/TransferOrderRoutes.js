import express from "express";
import {
  createTransferOrder,
  getTransferOrders,
  getTransferOrderById,
  updateTransferOrder,
  deleteTransferOrder,
  receiveTransferOrder,
  getItemStock,
} from "../controllers/TransferOrderController.js";

const router = express.Router();

router
  .route("/inventory/transfer-orders")
  .get(getTransferOrders)
  .post(createTransferOrder);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
router
  .route("/inventory/transfer-orders/stock/item")
  .get(getItemStock);

// Generic stock endpoint for all pages (alias to the same function)
router
  .route("/inventory/stock/item")
  .get(getItemStock);

router
  .route("/inventory/transfer-orders/:id")
  .get(getTransferOrderById)
  .put(updateTransferOrder)
  .delete(deleteTransferOrder);

router
  .route("/inventory/transfer-orders/:id/receive")
  .put(receiveTransferOrder);

export default router;


