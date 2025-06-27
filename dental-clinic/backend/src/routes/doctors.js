import express from "express";
import DoctorController from "../controllers/DoctorController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(authorize("admin", "doctor", "patient"), DoctorController.getDoctors);

router
	.route("/available")
	.get(
		authorize("admin", "doctor", "patient"),
		DoctorController.getAvailableDoctors
	);

router
	.route("/:id")
	.get(authorize("admin", "doctor", "patient"), DoctorController.getDoctor)
	.put(authorize("admin", "doctor"), DoctorController.updateDoctor)
	.delete(authorize("admin"), DoctorController.deleteDoctor);

router
	.route("/:id/work-hours")
	.put(authorize("admin", "doctor"), DoctorController.updateWorkHours);

router
	.route("/:id/available-slots")
	.get(
		authorize("admin", "doctor", "patient"),
		DoctorController.getAvailableTimeSlots
	);

router
	.route("/:id/patients")
	.get(authorize("admin", "doctor"), DoctorController.getDoctorPatients);

router
	.route("/:id/future-appointments")
	.get(authorize("admin", "doctor"), DoctorController.getFutureAppointments);

router
	.route("/:id/past-appointments")
	.get(authorize("admin", "doctor"), DoctorController.getPastAppointments);

export default router;
