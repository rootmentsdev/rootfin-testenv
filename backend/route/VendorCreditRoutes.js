import express from "express";
import {
  createVendorCredit,
  getVendorCredits,
  getVendorCreditById,
  updateVendorCredit,
  deleteVendorCredit,
} from "../controllers/VendorCreditController.js";

const router = express.Router();

router
  .route("/purchase/vendor-credits")
  .get(getVendorCredits)
  .post(createVendorCredit);

router
  .route("/purchase/vendor-credits/:id")
  .get(getVendorCreditById)
  .put(updateVendorCredit)
  .delete(deleteVendorCredit);

export default router;

