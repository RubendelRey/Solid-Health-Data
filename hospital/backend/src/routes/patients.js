import express from "express";
import { ObjectId } from "mongodb";
import {
	authenticateToken,
	canAccessPatientData,
	requireDoctorOrAdmin,
} from "../middleware/auth.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";

const router = express.Router();

router.get("/", authenticateToken, requireDoctorOrAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const query = {};
		if (search) {
			query.$or = [
				{ "name.family": { $regex: search, $options: "i" } },
				{ "name.given": { $regex: search, $options: "i" } },
				{ "identifier.value": { $regex: search, $options: "i" } },
			];
		}

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const patients = await PatientRepository.find(query);

		const total = patients.length;

		res.json({
			patients,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / parseInt(limit)),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get patients error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get(
	"/:id",
	authenticateToken,
	canAccessPatientData,
	async (req, res) => {
		try {
			const patient = await PatientRepository.findById(req.params.id);

			if (!patient) {
				return res.status(404).json({ message: "Patient not found" });
			}

			res.json(patient);
		} catch (error) {
			console.error("Get patient error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.put(
	"/:id",
	authenticateToken,
	canAccessPatientData,
	async (req, res) => {
		try {
			const patient = await PatientRepository.findById(req.params.id);
			if (!patient) {
				return res.status(404).json({ message: "Patient not found" });
			}

			const allowedFields = [
				"name",
				"telecom",
				"gender",
				"birthDate",
				"address",
				"contact",
				"communication",
				"generalPractitioner",
				"managingOrganization",
				"emergencyContact",
				"insurance",
				"maritalStatus",
			];

			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					patient[field] = req.body[field];
				}
			});

			await PatientRepository.update(req.params.id, patient);

			res.json({
				message: "Patient updated successfully",
				patient,
			});
		} catch (error) {
			console.error("Update patient error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/procedures",
	authenticateToken,
	canAccessPatientData,
	async (req, res) => {
		try {
			const {
				page = 1,
				limit = 10,
				status,
				sortBy = "performedDateTime",
				sortOrder = "desc",
			} = req.query;

			const query = { patient: new ObjectId(req.params.id) };
			if (status) {
				query.status = status;
			}

			const sort = {};
			sort[sortBy] = sortOrder === "desc" ? -1 : 1;

			const skip = (parseInt(page) - 1) * parseInt(limit);

			const procedures = await PatientProcedureRepository.find(query);
			const total = await PatientProcedureRepository.countDocuments(query);

			res.json({
				procedures,
				pagination: {
					current: parseInt(page),
					pages: Math.ceil(total / parseInt(limit)),
					total,
					limit: parseInt(limit),
				},
			});
		} catch (error) {
			console.error("Get patient procedures error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.post(
	"/:id/procedures",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const patientProcedure = {
				patient: req.params.id,
				doctor: req.user.doctor?._id || req.body.doctor,
				...req.body,
			};

			await PatientAllergyRepository.create(patientProcedure);

			const savedProcedure = await PatientProcedureRepository.findById(
				patientProcedure._id
			);

			res.status(201).json({
				message: "Procedure added successfully",
				procedure: savedProcedure,
			});
		} catch (error) {
			console.error("Add procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/allergies",
	authenticateToken,
	canAccessPatientData,
	async (req, res) => {
		try {
			const {
				page = 1,
				limit = 10,
				status,
				sortBy = "recordedDate",
				sortOrder = "desc",
			} = req.query;

			const query = { patient: new ObjectId(req.params.id) };
			if (status) {
				query["clinicalStatus.coding.code"] = status;
			}

			const sort = {};
			sort[sortBy] = sortOrder === "desc" ? -1 : 1;

			const skip = (parseInt(page) - 1) * parseInt(limit);

			const allergies = await PatientAllergyRepository.find(query);

			const total = await PatientAllergyRepository.countDocuments(query);

			res.json({
				allergies,
				pagination: {
					current: parseInt(page),
					pages: Math.ceil(total / parseInt(limit)),
					total,
					limit: parseInt(limit),
				},
			});
		} catch (error) {
			console.error("Get patient allergies error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.post(
	"/:id/allergies",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const patientAllergy = {
				patient: req.params.id,
				recorder: req.userId,
				...req.body,
			};

			const savedAllergy = await PatientAllergyRepository.create(
				patientAllergy
			);

			res.status(201).json({
				message: "Allergy added successfully",
				allergy: savedAllergy,
			});
		} catch (error) {
			console.error("Add allergy error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.put(
	"/:patientId/allergies/:allergyId",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const allergy = await PatientAllergyRepository.findOne({
				_id: req.params.allergyId,
				patient: req.params.patientId,
			});

			if (!allergy) {
				return res.status(404).json({ message: "Allergy not found" });
			}

			const allowedFields = [
				"clinicalStatus",
				"verificationStatus",
				"type",
				"category",
				"criticality",
				"code",
				"onsetDateTime",
				"lastOccurrence",
				"note",
				"reaction",
			];

			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					allergy[field] = req.body[field];
				}
			});

			await PatientAllergyRepository.update(allergy._id, allergy);

			const updatedAllergy = await PatientAllergyRepository.findById(
				allergy._id
			);

			res.json({
				message: "Allergy updated successfully",
				allergy: updatedAllergy,
			});
		} catch (error) {
			console.error("Update allergy error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.delete(
	"/:patientId/allergies/:allergyId",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const allergy = await PatientAllergyRepository.findOneAndDelete({
				_id: req.params.allergyId,
				patient: req.params.patientId,
			});

			if (!allergy) {
				return res.status(404).json({ message: "Allergy not found" });
			}

			res.json({ message: "Allergy deleted successfully" });
		} catch (error) {
			console.error("Delete allergy error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/summary",
	authenticateToken,
	canAccessPatientData,
	async (req, res) => {
		try {
			const patient = await PatientRepository.findById(req.params.id);

			if (!patient) {
				return res.status(404).json({ message: "Patient not found" });
			}

			const procedureCount = await PatientProcedureRepository.countDocuments({
				patient: req.params.id,
			});
			const allergyCount = await PatientAllergyRepository.countDocuments({
				patient: req.params.id,
			});

			const recentProcedures = await PatientProcedureRepository.find({
				patient: req.params.id,
			});

			const activeAllergies = await PatientAllergyRepository.find({
				patient: req.params.id,
				"clinicalStatus.coding.code": "active",
			});

			res.json({
				patient,
				stats: {
					procedureCount,
					allergyCount,
				},
				recentProcedures,
				activeAllergies,
			});
		} catch (error) {
			console.error("Get patient summary error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

export default router;
