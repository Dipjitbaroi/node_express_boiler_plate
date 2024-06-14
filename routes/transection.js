import { Router } from "express";
import { checkToken } from "../middleware/checkToken.js";
import {
  addTransaction,
  getBankings,
  getTransactionLogById,
  getTransactions,
} from "../controllers/transection.controller.js";

const router = Router();

/**
 * @swagger
 * /api/transection/add-transaction:
 *   post:
 *     summary: Add a new transaction.
 *     description: Add a new transaction for a user, either a deposit or withdrawal.
 *     tags:
 *       - Banking
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parent_id:
 *                 type: string
 *                 description: The ID of the parent user initiating the transaction.
 *               user_id:
 *                 type: string
 *                 description: The ID of the user for whom the transaction is being performed.
 *               transection_type:
 *                 type: string
 *                 description: The type of transaction, either "deposit" or "withdraw".
 *               transection_amount:
 *                 type: number
 *                 description: The amount of the transaction.
 *               password:
 *                 type: string
 *                 description: The password of the parent user for authentication.
 *               remark:
 *                 type: string
 *                 description: An optional remark or description for the transaction.
 *               transect_full_amount:
 *                 type: boolean
 *                 description: A boolean indicating whether the full amount is being transacted.
 *               ip_address:
 *                 type: string
 *                 description: The IP address associated with the transaction.
 *             example:
 *               parent_id: "64ee4256511a1cb4682ec3d1"
 *               user_id: "650cd3fc0018a52ef9532b62"
 *               transection_type: "withdraw"
 *               transection_amount: 4.54
 *               password: "securepassword"
 *               remark: "This is a test transaction"
 *               transect_full_amount: false
 *               ip_address: "192.3.4.5"
 *     responses:
 *       200:
 *         description: Transaction completed successfully.
 *       400:
 *         description: Invalid transaction.
 *       401:
 *         description: Unauthorized. Token not provided or invalid, or authentication failed.
 *       403:
 *         description: Forbidden. You do not have permission to perform this transaction.
 *       404:
 *         description: User or parent user not found.
 *       500:
 *         description: Internal Server Error.
 */

router.post("/add-transaction", checkToken, addTransaction);

/**
 * @swagger
 * /api/transection/get-bankings:
 *   get:
 *     summary: Get banking information and user data.
 *     tags: [Banking]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Bearer token for authentication.
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination.
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of items per page.
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       '200':
 *         description: Successfully retrieved user data and banking information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User' # Reference to the User schema
 *                 account:
 *                   type: object
 *                   properties:
 *                     available_balance:
 *                       type: number
 *                     balance_downline:
 *                       type: number
 *                     ref_PL:
 *                       type: string
 *                     credit_ref:
 *                       type: string
 *                     total_exposure:
 *                       type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '401':
 *         description: |
 *           Unauthorized: Invalid token.
 *           Please provide a valid authentication token.
 *       '404':
 *         description: No users found with the specified criteria.
 *       '500':
 *         description: Something went wrong.
 */

router.get("/get-bankings", checkToken, getBankings);

router.get("/transactionlogs/:user_id", checkToken, getTransactionLogById);
router.get("/get-transactions/:user_id", checkToken, getTransactions);

export default router;
