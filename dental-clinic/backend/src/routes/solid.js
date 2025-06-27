import express from "express";
import SolidController from "../controllers/SolidController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/login").get(SolidController.login);

router.route("/login/success").get(SolidController.successfulLogin);

router.route("/isLoggedIn").get(protect, SolidController.isLoggedIn);

router
	.route("/session")
	.get(
		protect,
		authorize("admin", "doctor", "patient"),
		SolidController.getSession
	);

router
	.route("/exportUserData")
	.post(protect, authorize("patient"), SolidController.exportUserData);

router
	.route("/importUserData")
	.post(protect, authorize("patient"), SolidController.importUserData);

export default router;
