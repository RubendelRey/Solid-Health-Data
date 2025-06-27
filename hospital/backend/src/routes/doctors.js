import express from "express";
import { ObjectId } from "mongodb";
import {
	authenticateToken,
	canAccessDoctorData,
	requireDoctorOrAdmin,
} from "../middleware/auth.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

const doctorRepository = DoctorRepository;
const patientProcedureRepository = PatientProcedureRepository;
const userRepository = UserRepository;
const patientRepository = PatientRepository;

router.get("/", authenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search,
			specialty,
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
		if (specialty) {
			query["specialty.coding.code"] = specialty;
		}

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const doctors = await doctorRepository.find(query);

		for (let doctor of doctors) {
			if (doctor.user) {
				const user = await userRepository.findById(doctor.user);
				if (user) {
					doctor.user = {
						email: user.email,
						isActive: user.isActive,
					};
				}
			}
		}

		const total = await doctorRepository.count(query);

		res.json({
			doctors,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / parseInt(limit)),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get doctors error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/:id", authenticateToken, canAccessDoctorData, async (req, res) => {
	try {
		const doctor = await doctorRepository.findById(req.params.id);

		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		if (doctor.user) {
			const user = await userRepository.findById(doctor.user);
			if (user) {
				doctor.user = {
					email: user.email,
					isActive: user.isActive,
					createdAt: user.createdAt,
					lastLogin: user.lastLogin,
				};
			}
		}

		res.json(doctor);
	} catch (error) {
		console.error("Get doctor error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.put("/:id", authenticateToken, canAccessDoctorData, async (req, res) => {
	try {
		const doctor = await doctorRepository.findById(req.params.id);
		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		const allowedFields = [
			"name",
			"telecom",
			"address",
			"gender",
			"birthDate",
			"specialty",
			"qualification",
			"communication",
			"workingHours",
			"availableTime",
			"notAvailable",
			"availabilityExceptions",
		];

		const updateData = {};
		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updateData[field] = req.body[field];
			}
		});

		const updatedDoctor = await doctorRepository.update(
			req.params.id,
			updateData
		);

		res.json({
			message: "Doctor updated successfully",
			doctor: updatedDoctor,
		});
	} catch (error) {
		console.error("Update doctor error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get(
	"/:id/schedule",
	authenticateToken,
	canAccessDoctorData,
	async (req, res) => {
		try {
			const { date, week, month } = req.query;

			let startDate, endDate;

			if (date) {
				startDate = new Date(date);
				endDate = new Date(date);
				endDate.setDate(endDate.getDate() + 1);
			} else if (week) {
				startDate = new Date(week);
				endDate = new Date(week);
				endDate.setDate(endDate.getDate() + 7);
			} else if (month) {
				startDate = new Date(month);
				endDate = new Date(
					startDate.getFullYear(),
					startDate.getMonth() + 1,
					1
				);
			} else {
				startDate = new Date();
				startDate.setDate(startDate.getDate() - startDate.getDay());
				endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + 7);
			}
			const procedures = await patientProcedureRepository.findAll({
				doctor: req.params.id,
				performedDateTime: { $gte: startDate, $lt: endDate },
			});

			procedures.sort(
				(a, b) => new Date(a.performedDateTime) - new Date(b.performedDateTime)
			);
			for (let procedure of procedures) {
				if (procedure.patient) {
					const patient = await patientRepository.findById(procedure.patient);
					if (patient) {
						procedure.patientData = {
							name: patient.name,
						};
					}
				}
			}

			const doctor = await doctorRepository.findById(req.params.id);
			res.json({
				doctor: {
					id: req.params.id,
					workingHours: doctor?.workingHours,
					availableTime: doctor?.availableTime,
				},
				procedures,
				period: {
					start: startDate,
					end: endDate,
				},
			});
		} catch (error) {
			console.error("Get doctor schedule error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/appointments",
	authenticateToken,
	canAccessDoctorData,
	async (req, res) => {
		try {
			const {
				page = 1,
				limit = 10,
				status,
				date,
				sortBy = "start",
				sortOrder = "asc",
			} = req.query;

			const query = {
				doctor: new ObjectId(req.params.id),
			};

			if (status) {
				query.status = status;
			}

			const sort = {};
			sort[sortBy] = sortOrder === "desc" ? -1 : 1;
			const skip = (parseInt(page) - 1) * parseInt(limit);
			let procedures = await patientProcedureRepository.findAll(query, {
				skip,
				limit: parseInt(limit),
				sort,
			});

			for (let procedure of procedures) {
				if (procedure.patient) {
					const patient = await patientRepository.findById(procedure.patient);
					if (patient) {
						procedure.patientData = {
							name: patient.name,
							telecom: patient.telecom,
						};
					}
				}
			}

			const total = procedures.length;

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
			console.error("Get doctor appointments error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/patients",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const { page = 1, limit = 10, search } = req.query;
			const skip = (parseInt(page) - 1) * parseInt(limit);

			const patientProcedures = await patientProcedureRepository.find({
				doctor: req.params.id,
			});

			const uniquePatientIds = [
				...new Set(patientProcedures.map((pp) => pp.patient)),
			];

			let patients = [];
			for (let patientId of uniquePatientIds) {
				const patient = await patientRepository.findById(patientId);
				if (patient) {
					if (patient.user) {
						const user = await userRepository.findById(patient.user);
						if (user) {
							patient.user = {
								email: user.email,
								isActive: user.isActive,
							};
						}
					}
					patients.push(patient);
				}
			}
			let filteredPatients = patients;
			if (search) {
				filteredPatients = patients.filter((patient) => {
					if (!patient || !patient.name) return false;
					const fullName = patient.name
						.map((n) => `${n.given?.join(" ")} ${n.family}`)
						.join(" ");
					return fullName.toLowerCase().includes(search.toLowerCase());
				});
			}

			const total = filteredPatients.length;
			const paginatedPatients = filteredPatients.slice(
				skip,
				skip + parseInt(limit)
			);

			res.json({
				patients: paginatedPatients,
				pagination: {
					current: parseInt(page),
					pages: Math.ceil(total / parseInt(limit)),
					total,
					limit: parseInt(limit),
				},
			});
		} catch (error) {
			console.error("Get doctor patients error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/procedures",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const {
				page = 1,
				limit = 10,
				status,
				date,
				sortBy = "performedDateTime",
				sortOrder = "desc",
			} = req.query;

			const query = { doctor: new ObjectId(req.params.id) };
			if (status) {
				query.status = status;
			}
			if (date) {
				const startDate = new Date(date);
				const endDate = new Date(date);
				endDate.setDate(endDate.getDate() + 1);
				query.performedDateTime = { $gte: startDate, $lt: endDate };
			}

			const sort = {};
			sort[sortBy] = sortOrder === "desc" ? -1 : 1;
			const skip = (parseInt(page) - 1) * parseInt(limit);

			const procedures = await patientProcedureRepository.find();

			for (let procedure of procedures) {
				if (procedure.patient) {
					const patient = await patientRepository.findById(procedure.patient);
					if (patient) {
						procedure.patient = {
							name: patient.name,
							identifier: patient.identifier,
						};
					}
				}
			}

			const total = await patientProcedureRepository.count(query);

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
			console.error("Get doctor procedures error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.put(
	"/:id/working-hours",
	authenticateToken,
	canAccessDoctorData,
	async (req, res) => {
		try {
			const doctor = await doctorRepository.findById(req.params.id);
			if (!doctor) {
				return res.status(404).json({ message: "Doctor not found" });
			}

			const {
				workingHours,
				availableTime,
				notAvailable,
				availabilityExceptions,
			} = req.body;

			const updateData = {};
			if (workingHours) updateData.workingHours = workingHours;
			if (availableTime) updateData.availableTime = availableTime;
			if (notAvailable) updateData.notAvailable = notAvailable;
			if (availabilityExceptions)
				updateData.availabilityExceptions = availabilityExceptions;

			const updatedDoctor = await doctorRepository.update(
				req.params.id,
				updateData
			);

			res.json({
				message: "Working hours updated successfully",
				workingHours: updatedDoctor.workingHours,
				availableTime: updatedDoctor.availableTime,
				notAvailable: updatedDoctor.notAvailable,
				availabilityExceptions: updatedDoctor.availabilityExceptions,
			});
		} catch (error) {
			console.error("Update working hours error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/:id/stats",
	authenticateToken,
	canAccessDoctorData,
	async (req, res) => {
		try {
			const doctorId = req.params.id;

			const totalProcedures = await patientProcedureRepository.count({
				doctor: doctorId,
			});
			const completedProcedures = await patientProcedureRepository.count({
				doctor: doctorId,
				status: "completed",
			});
			const totalScheduledProcedures = await patientProcedureRepository.count({
				doctor: doctorId,
			});

			const todayProcedures = await patientProcedureRepository.count({
				doctor: doctorId,
				performedDateTime: {
					$gte: new Date(new Date().setHours(0, 0, 0, 0)),
					$lt: new Date(new Date().setHours(23, 59, 59, 999)),
				},
			});

			const patientProcedures = await patientProcedureRepository.findAll({
				doctor: doctorId,
			});
			const uniquePatientIds = [
				...new Set(patientProcedures.map((pp) => pp.patient)),
			];
			const totalPatients = uniquePatientIds.length;

			res.json({
				totalProcedures,
				completedProcedures,
				totalScheduledProcedures,
				todayProcedures,
				totalPatients,
			});
		} catch (error) {
			console.error("Get doctor stats error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

export default router;
