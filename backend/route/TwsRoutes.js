import express from "express";
import { getEditedOverrides } from "../controllers/TwsControllers.js";
import { getEditedTransactions } from "../controllers/EditController.js";
import { getsaveCashBank } from "../controllers/EditController.js";


const router = express.Router();

router.get("/getEditedTransactions",getEditedOverrides );
router.get("/getEditedTransactions", getEditedTransactions);
router.get("/getsaveCashBank", getsaveCashBank);




export default router;
