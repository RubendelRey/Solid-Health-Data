import express from "express";
import InterventionController from "../controllers/InterventionController.js";
import PatientController from "../controllers/PatientController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(authorize("admin", "doctor"), PatientController.getPatients);

router
	.route("/:id")
	.get(authorize("admin", "doctor", "patient"), PatientController.getPatient)
	.put(authorize("admin", "doctor"), PatientController.updatePatient)
	.delete(authorize("admin"), PatientController.deletePatient);

router
	.route("/:id/allergies")
	.get(
		authorize("admin", "doctor", "patient"),
		PatientController.getPatientAllergies
	)
	.post(authorize("admin", "doctor"), PatientController.addAllergy);

router
	.route("/byAllergy/:allergyId")
	.get(authorize("admin", "doctor"), PatientController.getPatientsWithAllergy);

router
	.route("/:patientId/interventions")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getPatientInterventions
	);

export default router;
