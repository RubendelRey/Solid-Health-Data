import express from "express";
import UserController from "../controllers/UserController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.use(authorize("admin"));

router.route("/").get(UserController.getUsers).post(UserController.createUser);

router
	.route("/:id")
	.get(UserController.getUser)
	.put(UserController.updateUser)
	.delete(UserController.deleteUser);

router.route("/role/:role").get(UserController.getUsersByRole);

router.route("/:id/password").put(UserController.changeUserPassword);

router.route("/:id/status").put(UserController.toggleUserStatus);

export default router;
