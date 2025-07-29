import express from 'express';
import { Login, SignUp } from '../controllers/LoginAndSignup.js';
import { CreatePayment, GetPayment } from '../controllers/TransactionController.js';
import { CloseController, GetAllCloseData, GetCloseController } from '../controllers/CloseController.js';
import { editTransaction} from '../controllers/EditController.js';
import Transaction from '../model/Transaction.js';
import {DownloadAttachment} from "../controllers/TransactionController.js";
import { body, validationResult } from 'express-validator';


const router = express.Router();

// Validation middleware
const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(validation => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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
router.post('/signin',
  validate([
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('locCode').notEmpty().withMessage('Location code is required'),
    body('power').notEmpty().withMessage('Role (power) is required'),
  ]),
  SignUp
)



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
router.post('/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  Login
)


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
router.post('/createPayment',
  validate([
    body('locCode').notEmpty().withMessage('Location code is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').notEmpty().withMessage('Type is required'),
  ]),
  CreatePayment
)


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
router.post('/saveCashBank',
  validate([
    body('locCode').notEmpty().withMessage('Location code is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('cash').isNumeric().withMessage('Cash must be a number'),
    body('bank').isNumeric().withMessage('Bank must be a number'),
  ]),
  CloseController
)


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




export default router;