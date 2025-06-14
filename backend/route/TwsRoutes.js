import express from "express";
import { getEditedOverrides } from "../controllers/TwsControllers.js";

const router = express.Router();

router.get("/getEditedTransactions",getEditedOverrides );

export default router;
