import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";

const router = express.Router();

const patientProcedureRepository = PatientProcedureRepository;
const doctorRepository = DoctorRepository;
const patientRepository = PatientRepository;

router.get("/", authenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status,
			doctor,
			patient,
			date,
			dateFrom,
			dateTo,
			sortBy = "performedDateTime",
			sortOrder = "desc",
		} = req.query;

		const query = {};
		switch (req.user.role) {
			case "administrator":
				break;
			case "doctor":
				if (req.user.doctor) {
					query.doctor = req.user.doctor._id;
				}
				break;
			case "patient":
				if (req.user.patient) {
					query.patient = req.user.patient;
				}
				break;
			default:
				return res.status(403).json({ message: "Access denied" });
		}
		if (status) query.status = status;
		if (doctor) query.doctor = doctor;
		if (patient) query.patient = patient;

		if (date) {
			const startDate = new Date(date);
			const endDate = new Date(date);
		} else if (dateFrom || dateTo) {
		}

		const procedures = await patientProcedureRepository.find(query);

		for (let procedure of procedures) {
			if (procedure.patient) {
				const patientData = await patientRepository.findById(procedure.patient);
				if (patientData) {
					procedure.patientData = {
						name: patientData.name,
						telecom: patientData.telecom,
					};
				}
			}

			if (procedure.doctor) {
				const doctorData = await doctorRepository.findById(procedure.doctor);
				if (doctorData) {
					procedure.doctorData = {
						name: doctorData.name,
						telecom: doctorData.telecom,
						specialty: doctorData.specialty,
					};
				}
			}
		}

		const total = await patientProcedureRepository.count(query);

		res.json({
			appointments: procedures,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / parseInt(limit)),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get procedures error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/:id", authenticateToken, async (req, res) => {
	try {
		const procedure = await patientProcedureRepository.findById(req.params.id);

		if (!procedure) {
			return res.status(404).json({ message: "Procedure not found" });
		}

		if (
			req.user.role === "patient" &&
			procedure.patient.toString() !== req.user.patient._id
		) {
			return res.status(403).json({ message: "Access denied" });
		}
		if (
			req.user.role === "doctor" &&
			procedure.doctor.toString() !== req.user.doctor._id
		) {
			return res.status(403).json({ message: "Access denied" });
		}

		if (procedure.patient) {
			const patientData = await patientRepository.findById(procedure.patient);
			if (patientData) {
				procedure.patientData = {
					name: patientData.name,
					telecom: patientData.telecom,
				};
			}
		}

		if (procedure.doctor) {
			const doctorData = await doctorRepository.findById(procedure.doctor);
			if (doctorData) {
				procedure.doctorData = {
					name: doctorData.name,
					telecom: doctorData.telecom,
					specialty: doctorData.specialty,
				};
			}
		}

		res.json(procedure);
	} catch (error) {
		console.error("Get procedure error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

export default router;
