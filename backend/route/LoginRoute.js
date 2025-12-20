import express from 'express';
import { Login, SignUp, GetAllStores } from '../controllers/LoginAndSignup.js';
import { CreatePayment, GetPayment } from '../controllers/TransactionController.js';
import { CloseController, GetAllCloseData, GetCloseController, getFinancialSummaryWithEdit } from '../controllers/CloseController.js';
import { editTransaction} from '../controllers/EditController.js';
import Transaction from '../model/Transaction.js';
import {DownloadAttachment} from "../controllers/TransactionController.js";



const router = express.Router();


/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Create a new user
 *     description: Endpoint to create/register a new user.
 *     responses:
 *       200:
 *         description: Successfully created a new user.
 *       400:
 *         description: Bad Request, validation errors.
 *       500:
 *         description: Internal server error.
 */
router.post('/signin', SignUp)



/**
 * @swagger
 * /login:
 *   post:
 *     summary: login a user
 *     description: Endpoint to login a new user.
 *     responses:
 *       200:
 *         description: Successfully login a user.
 *       400:
 *         description: Bad Request, validation errors.
 *       500:
 *         description: Internal server error.
 */
router.post('/login', Login)

/**
 * @swagger
 * /getAllStores:
 *   get:
 *     summary: Retrieve all stores
 *     description: Fetches all stores/users from the database.
 *     responses:
 *       200:
 *         description: Successfully retrieved stores.
 *       500:
 *         description: Internal server error.
 */
router.get('/getAllStores', GetAllStores)


/**
 * @swagger
 * /createPayment:
 *   post:
 *     summary: Responsible for creating three transactions
 *     description: This endpoint creates three transaction records related to a payment process.
 *     responses:
 *       200:
 *         description: Successfully created three transactions.
 *       400:
 *         description: Bad Request, validation errors.
 *       500:
 *         description: Internal server error.
 */
router.post('/createPayment', CreatePayment)


/**
 * @swagger
 * /Getpayment:
 *   get:
 *     summary: Retrieve all payment transactions
 *     description: Fetches all created payment transaction records.
 *     responses:
 *       200:
 *         description: Successfully retrieved payment transactions.
 *       401:
 *         description: Unauthorized, invalid credentials or no token provided.
 *       500:
 *         description: Internal server error.
 */
router.get('/Getpayment', GetPayment)


/**
 * @swagger
 * /saveCashBank:
 *   post:
 *     summary: Save cash and bank transaction data
 *     description: Saves the cash and bank closing balance or transaction information.
 *     responses:
 *       200:
 *         description: Successfully saved cash and bank data.
 *       400:
 *         description: Bad Request, validation errors.
 *       500:
 *         description: Internal server error.
 */
router.post('/saveCashBank', CloseController)


/**
 * @swagger
 * /getsaveCashBank:
 *   get:
 *     summary: Retrieve saved cash and bank data
 *     description: Fetches the saved cash and bank transaction or closing balance information.
 *     responses:
 *       200:
 *         description: Successfully retrieved cash and bank data.
 *       401:
 *         description: Unauthorized, invalid credentials or no token provided.
 *       500:
 *         description: Internal server error.
 */
router.get('/getsaveCashBank', GetCloseController)

/**
 * @swagger
 * /AdminColseView:
 *   get:
 *     summary: Retrieve the branches close data
 *     description: Fetches  closing balance information.
 *     responses:
 *       200:
 *         description: Successfully retrieved cash and bank data.
 *       401:
 *         description: Unauthorized, invalid credentials or no token provided.
 *       500:
 *         description: Internal server error.
 */
router.get('/AdminColseView', GetAllCloseData)



/**
 * @swagger
 * /getTransactions:
 *   get:
 *     summary: Retrieve transactions from MongoDB
 *     description: Fetches transactions stored in the MongoDB `transactions` collection, filtered by location code and date range.
 *     parameters:
 *       - in: query
 *         name: locCode
 *         required: true
 *         description: Location code of the branch
 *         schema:
 *           type: string
 *           example: "Zorucci-Kochi"
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         description: Start date for filtering (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-01"
 *       - in: query
 *         name: dateTo
 *         required: true
 *         description: End date for filtering (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-11"
 *     responses:
 *       200:
 *         description: Successfully retrieved filtered transactions from database.
 *       400:
 *         description: Bad request or missing parameters.
 *       500:
 *         description: Internal server error.
 */
router.get('/getTransactions', async (req, res) => {
  const { locCode, dateFrom, dateTo } = req.query;
  const transactions = await Transaction.find({
    locCode,
    date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) }
  });
  res.json({ data: transactions });
});




// routes/user.js
router.post('/syncTransaction', async (req, res) => {
  try {
    console.log("Incoming sync data:", req.body);
    const newTransaction = await Transaction.create(req.body);
    return res.status(201).json({ message: "Synced", data: newTransaction });
  } catch (err) {
    console.error("Sync error:", err); // this shows the exact line failing
    return res.status(500).json({ error: err.message });
  }
});








router.put('/editTransaction/:id', editTransaction);



router.get("/transaction/:id/attachment", DownloadAttachment);

/**
 * @swagger
 * /financialSummaryWithEdit:
 *   get:
 *     summary: Get Financial Summary with Edit Support
 *     description: Retrieves financial summary data with individual transactions for editing
 *     parameters:
 *       - in: query
 *         name: locCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Location code
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *         description: User role (admin/super_admin)
 *     responses:
 *       200:
 *         description: Successfully retrieved financial summary with edit support
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/financialSummaryWithEdit', getFinancialSummaryWithEdit);




export default router;