import { Router } from "express";
import {
  addUser,
  loginUser,
  updatePassword,
  updateUserStatus,
  getUser,
  getAllUsers,
  getUsersByParentId,
  updateUserField,
  getUserById,
  changePasswordDownline,
  deleteUser,
  getActivityLogById,
  createSuperUser,
  searchUser,
  getTopPlayers,
  getDownlineUsers,
  getDownlineUserList,
  updateUser,
  updateSettingLimits,
  sendMessage,
  getMessageList,
  getDefaultSettings,
  updateMessage,
  deleteMessage,
  getWebSettings,
} from "../controllers/user.controller.js";
import { checkToken } from "../middleware/checkToken.js";
import { creditRef } from "../controllers/user.controller.js";

const router = Router();
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * info:
 *   title: Sports API
 *   version: 1.0.0
 *   description: Documentation for Sports API.
 *
 * /api/users/get-user:
 *   get:
 *     summary: Get a list of users.
 *     description: Returns a list of users.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: A list of users.
 */
router.get("/get-user", checkToken, getUser);
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /api/users/login:
 *   post:
 *     summary: Authenticate a user.
 *     description: Authenticate a user by providing a username and password.
 *     tags:
 *        - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               isp:
 *                 type: string
 *               city_state_country:
 *                 type: string
 *
 *             example:
 *               username: john_doe2
 *               password: securepassword
 *               ip_address: 103.81.199.25
 *               isp: Dhaka Fiber Net Ltd
 *               city_state_country: Dhaka/Dhaka Division/Bangladesh
 *     responses:
 *       200:
 *         description: Authentication successful.
 *       401:
 *         description: Authentication failed.
 */
router.post("/login", loginUser);
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /api/users/add-user:
 *   post:
 *     summary: Add a new user.
 *     description: Add a new user to the system. Requires authorization.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parent_id:
 *                 type: string
 *                 description: The parent ID of the new user (replace with a valid ObjectId).
 *               username:
 *                 type: string
 *                 description: The username for the new user.
 *               password:
 *                 type: string
 *                 description: The password for the new user.
 *               accountType:
 *                 type: string
 *                 enum:
 *                   - subadmin
 *                   - admin
 *                   - super-master
 *                   - master
 *                   - user
 *
 *                 description: The account type for the new user (user or admin).
 *             example:
 *               parent_id: "64ee31fe71774fc933de86fd"
 *               username: "john_doe2"
 *               password: "securepassword"
 *               accountType: "user"
 *     responses:
 *       201:
 *         description: User created successfully.
 *       401:
 *         description: Unauthorized. Authentication required.
 *       400:
 *         description: Bad request. Invalid request body.
 *       500:
 *         description: Internal Server Error.
 */

router.post("/add-user", addUser);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password.
 *     description: Change the password for an authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The current password of the user.
 *               newPassword:
 *                 type: string
 *                 description: The new password for the user.
 *             example:
 *               currentPassword: "old_password123"
 *               newPassword: "new_secure_password456"
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       401:
 *         description: Unauthorized. Token not provided or invalid.
 *       404:
 *         description: User not found.
 *       403:
 *         description: Forbidden. User not authorized to change the password.
 *       500:
 *         description: Internal Server Error.
 */

router.post("/change-password", checkToken, updatePassword);

/**
 * @swagger
 * /api/users/update-status:
 *   patch:
 *     summary: Update user status.
 *     description: Update the status of an authenticated user. Requires authorization.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                   - Closed
 *                   - Locked
 *                 description: The new status value to set for the user.
 *               user_id:
 *                 type: string
 *                 description: The ID of the user whose status is to be updated.
 *               password:
 *                 type: string
 *                 description: The password of the parent user for authentication.
 *             example:
 *               status: "Active"
 *               user_id: "user_id_here"
 *               password: "parent_password"
 *     responses:
 *       200:
 *         description: User status updated successfully. Returns the updated user's information.
 *       401:
 *         description: Unauthorized. Token not provided or invalid, or authentication failed.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/update-status", checkToken, updateUserStatus);

router.get("/get-all-users", checkToken, getAllUsers);

/**
 * @swagger
 * /api/users/get-user-by-parent:
 *   get:
 *     summary: Get users by parent ID with pagination and optional account type filtering.
 *     description: Get a list of users with the specified parent_id, optionally filtered by account type. Supports pagination with query parameters (page and limit).
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The parent ID for which to retrieve users.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination (default is 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items to return per page (default is 10).
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: ["subadmin", "admin","super_master","master","user",]
 *         description: Optional. Filter users by account type ("subadmin", "admin","super_master","master","user",).
 *     responses:
 *       200:
 *         description: Users retrieved successfully.
 *       404:
 *         description: No users found with the specified criteria.
 *       500:
 *         description: Internal Server Error.
 */

router.get("/get-user-by-parent", checkToken, getUsersByParentId);

/**
 * @swagger
 * /api/users/update-user-field:
 *   patch:
 *     summary: Update user field.
 *     description: Update a specific field of a user's data. Requires authorization.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: The name of the field to update (e.g., "name", "email").
 *               value:
 *                 type: string
 *                 description: The new value to set for the field.
 *               user_id:
 *                 type: string
 *                 description: The user ID of the user to update.
 *               password:
 *                 type: string
 *                 description: The password of the current user.
 *             example:
 *               field: "available_balance"
 *               value: "5000"
 *               user_id: "user_id_here"
 *               password: "password"
 *     responses:
 *       200:
 *         description: User field updated successfully. Returns the updated user's information.
 *       401:
 *         description: Unauthorized. Token not provided or invalid.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */

router.patch("/update-user-field", checkToken, updateUserField);
router.patch("/update-credit-ref", checkToken, creditRef);
/**
 * @swagger
 * /api/users/get-user/{user_id}:
 *   get:
 *     summary: Get user by ID.
 *     description: Retrieve a user by their unique user ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the user to retrieve.
 *     responses:
 *       200:
 *         description: User retrieved successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/get-user/:user_id", getUserById);
router.get("/get-top-players", checkToken, getTopPlayers);
/**
 * @swagger
 * /api/users/change-password-downline:
 *   patch:
 *     summary: Change downline user's password.
 *     description: Change the password of an authenticated downline user. Requires authorization.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: The ID of the downline user whose password is to be changed.
 *               new_password:
 *                 type: string
 *                 description: The new password to set for the downline user.
 *             example:
 *               user_id: "user_id_here"
 *               new_password: "new_password_here"
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       401:
 *         description: Unauthorized. Token not provided or invalid.
 *       404:
 *         description: Downline user not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/change-password-downline", checkToken, changePasswordDownline);

/**
 * @swagger
 * /api/users/delete-user:
 *   delete:
 *     tags:
 *       - User
 *     security:
 *       - BearerAuth: []
 *     summary: Delete a user
 *     description: Deletes a user based on user_id and authorization token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: The ID of the downline user whose id is to be deleted.
 *               password:
 *                 type: string
 *                 description: The password to confirm authorization.
 *             example:
 *               user_id: "user_id_here"
 *               password: "password_here"
 *     responses:
 *       '200':
 *         description: User deleted successfully
 *       '401':
 *         description: Unauthorized - Invalid token or token not provided
 *       '403':
 *         description: Forbidden - User not authorized to delete or update user
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Something went wrong
 */
router.delete("/delete-user", checkToken, deleteUser);

router.get("/activity-logs/:user_id", checkToken, getActivityLogById);

router.post("/create-superuser", createSuperUser);

router.get("/search-user", checkToken, searchUser);

router.get("/get-downline-users/:user_id", checkToken, getDownlineUsers);

router.get("/get-downline-user-list", checkToken, getDownlineUserList);

router.patch("/update-user", checkToken, updateUser);

router.patch("/update-setting-limits", checkToken, updateSettingLimits);

router.post("/send-message", checkToken, sendMessage);

router.get("/get-message-list/:userId", checkToken, getMessageList);

router.patch("/update-message/:messageId", checkToken, updateMessage);

router.delete("/delete-message/:messageId", checkToken, deleteMessage);
router.get("/get-web-settings/:domain", getWebSettings);

router.get("/get-default-settings", checkToken, getDefaultSettings);

export default router;
