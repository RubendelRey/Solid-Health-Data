import express from "express";
import InterventionTypeController from "../controllers/InterventionTypeController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionTypeController.getInterventionTypes
	)
	.post(
		authorize("admin", "doctor"),
		InterventionTypeController.createInterventionType
	);

router
	.route("/:id")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionTypeController.getInterventionType
	)
	.put(
		authorize("admin", "doctor"),
		InterventionTypeController.updateInterventionType
	);

router
	.route("/category/:category")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionTypeController.getInterventionTypesByCategory
	);

export default router;
