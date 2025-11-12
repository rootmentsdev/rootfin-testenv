import express from "express";
import {
  createItemGroup,
  getItemGroups,
  getItemGroupById,
  updateItemGroup,
  deleteItemGroup,
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

export default router;

