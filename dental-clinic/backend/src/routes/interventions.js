import express from "express";
import InterventionController from "../controllers/InterventionController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(authorize("admin", "doctor"), InterventionController.getInterventions)
	.post(
		authorize("admin", "doctor"),
		InterventionController.createIntervention
	);

router
	.route("/:id")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getIntervention
	)
	.put(authorize("admin", "doctor"), InterventionController.updateIntervention)
	.delete(
		authorize("admin", "doctor"),
		InterventionController.deleteIntervention
	);

router
	.route("/:id/state")
	.put(
		authorize("admin", "doctor"),
		InterventionController.updateInterventionState
	);

router
	.route("/doctor/:doctorId")
	.get(
		authorize("admin", "doctor"),
		InterventionController.getDoctorInterventions
	);

router
	.route("/patient/:patientId")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getPatientInterventions
	);

router
	.route("/appointment-slots")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getAvailableAppointmentSlots
	);

router
	.route("/appointments/available")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getAvailableAppointmentSlots
	);

router
	.route("/appointments/check-availability")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.checkDoctorAvailability
	);

router
	.route("/appointments")
	.post(
		authorize("admin", "doctor", "patient"),
		InterventionController.scheduleAppointment
	);

router
	.route("/appointments/:id")
	.put(
		authorize("admin", "doctor", "patient"),
		InterventionController.rescheduleAppointment
	);

router
	.route("/appointments/:id/cancel")
	.put(
		authorize("admin", "doctor", "patient"),
		InterventionController.cancelAppointment
	);

router
	.route("/appointments/doctor/:doctorId")
	.get(
		authorize("admin", "doctor"),
		InterventionController.getDoctorAppointments
	);

router
	.route("/appointments/patient/:patientId")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getPatientAppointments
	);

router
	.route("/appointments/patient/:patientId/past")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getPatientPastAppointments
	);

router
	.route("/appointments/patient/:patientId/upcoming")
	.get(
		authorize("admin", "doctor", "patient"),
		InterventionController.getPatientUpcomingAppointments
	);

router
	.route("/doctor/:doctorId/patients")
	.get(authorize("admin", "doctor"), InterventionController.getDoctorPatients);

export default router;
