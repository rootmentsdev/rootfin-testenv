import express from "express";
import {
  createItemGroup,
  getItemGroups,
  getItemGroupById,
  updateItemGroup,
  deleteItemGroup,
  getItemHistory,
} from "../controllers/ItemGroupController.js";

const router = express.Router();

router
  .route("/shoe-sales/item-groups")
  .get(getItemGroups)
  .post(createItemGroup);

router
  .route("/shoe-sales/item-groups/:id")
  .get(getItemGroupById)
  .put(updateItemGroup)
  .delete(deleteItemGroup);

router
  .route("/shoe-sales/item-groups/:id/items/:itemId/history")
  .get(getItemHistory);

export default router;

