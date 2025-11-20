import express from "express";
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} from "../controllers/VendorController.js";

const router = express.Router();

router
  .route("/purchase/vendors")
  .get(getVendors)
  .post(createVendor);

router
  .route("/purchase/vendors/:id")
  .get(getVendorById)
  .put(updateVendor)
  .delete(deleteVendor);

export default router;

