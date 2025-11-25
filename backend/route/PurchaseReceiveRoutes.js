import express from "express";
import {
  createPurchaseReceive,
  getPurchaseReceives,
  getPurchaseReceiveById,
  updatePurchaseReceive,
  deletePurchaseReceive,
} from "../controllers/PurchaseReceiveController.js";

const router = express.Router();

router
  .route("/purchase/receives")
  .get(getPurchaseReceives)
  .post(createPurchaseReceive);

router
  .route("/purchase/receives/:id")
  .get(getPurchaseReceiveById)
  .put(updatePurchaseReceive)
  .delete(deletePurchaseReceive);

export default router;

