import express from "express";
import {
  createPurchaseReceive,
  getPurchaseReceives,
  getPurchaseReceiveById,
  updatePurchaseReceive,
  deletePurchaseReceive,
  getNextReceiveNumber,
} from "../controllers/PurchaseReceiveController.js";

const router = express.Router();

router.get("/purchase/receives/next-number", getNextReceiveNumber); // Get next auto-generated receive number

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

