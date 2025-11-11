import express from "express";
import { createShoeItem, getShoeItems, getShoeItemById } from "../controllers/ShoeItemController.js";

const router = express.Router();

router
  .route("/shoe-sales/items")
  .get(getShoeItems)
  .post(createShoeItem);

router.route("/shoe-sales/items/:itemId").get(getShoeItemById);

export default router;

