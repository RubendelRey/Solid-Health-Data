import express from "express";
import AllergyCatalogueController from "../controllers/AllergyCatalogueController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(
		authorize("admin", "doctor", "patient"),
		AllergyCatalogueController.getAllergies
	)
	.post(authorize("admin", "doctor"), AllergyCatalogueController.createAllergy);

router
	.route("/:id")
	.get(
		authorize("admin", "doctor", "patient"),
		AllergyCatalogueController.getAllergy
	);

router
	.route("/code/:code")
	.get(
		authorize("admin", "doctor", "patient"),
		AllergyCatalogueController.getAllergyByCode
	);

router
	.route("/type/:type")
	.get(
		authorize("admin", "doctor", "patient"),
		AllergyCatalogueController.getAllergiesByType
	);

export default router;
