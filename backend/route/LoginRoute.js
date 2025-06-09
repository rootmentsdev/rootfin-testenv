import express from 'express';
import { Login, SignUp } from '../controllers/LoginAndSignup.js';
import { CreatePayment, GetPayment } from '../controllers/TransactionController.js';
import { CloseController, GetAllCloseData, GetCloseController } from '../controllers/CloseController.js';

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
 *     summary: Login a user
 *     description: Endpoint to login a user with email and EmpId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - EmpId
 *             properties:
 *               email:
 *                 type: string
 *                 example: officerootments@gmail.com
 *               EmpId:
 *                 type: string
 *                 example: Rootments@720
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */


router.post('/login', Login)


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

export default router;
