import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrderByNumber,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../controllers/PurchaseOrderController.js";

const router = express.Router();

router
  .route("/purchase/orders")
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

router
  .route("/purchase/orders/number/:orderNumber")
  .get(getPurchaseOrderByNumber);

router
  .route("/purchase/orders/:id")
  .get(getPurchaseOrderById)
  .put(updatePurchaseOrder)
  .delete(deletePurchaseOrder);

export default router;

