import express from "express";
import {
	authenticateToken,
	requireAdmin,
	requireDoctorOrAdmin,
} from "../middleware/auth.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import ProcedureCatalogRepository from "../repositories/ProcedureCatalogRepository.js";

const router = express.Router();

router.get("/catalog", authenticateToken, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search,
			category,
			sortBy = "code.coding.display",
			sortOrder = "asc",
		} = req.query;

		const query = {};
		if (search) {
			query.$or = [
				{ "code.coding.display": { $regex: search, $options: "i" } },
				{ "code.coding.code": { $regex: search, $options: "i" } },
				{ "code.text": { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}
		if (category) {
			query["category.coding.code"] = category;
		}

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const procedures = await ProcedureCatalogRepository.find(query);

		const total = await ProcedureCatalogRepository.countDocuments(query);

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
		console.error("Get procedure catalog error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/catalog/:id", authenticateToken, async (req, res) => {
	try {
		const procedure = await ProcedureCatalogRepository.findById(req.params.id);

		if (!procedure) {
			return res.status(404).json({ message: "Procedure not found" });
		}

		res.json(procedure);
	} catch (error) {
		console.error("Get procedure error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.post("/catalog", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const procedure = await ProcedureCatalogRepository.create(req.body);

		res.status(201).json({
			message: "Procedure created successfully",
			procedure,
		});
	} catch (error) {
		console.error("Create procedure error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.put(
	"/catalog/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const procedure = await ProcedureCatalogRepository.findById(
				req.params.id
			);

			if (!procedure) {
				return res.status(404).json({ message: "Procedure not found" });
			}

			const allowedFields = [
				"code",
				"category",
				"description",
				"bodySite",
				"status",
				"cost",
				"duration",
				"preparation",
				"followUp",
				"complications",
				"contraindications",
			];

			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					procedure[field] = req.body[field];
				}
			});

			await ProcedureCatalogRepository.update(procedure._id, procedure);

			res.json({
				message: "Procedure updated successfully",
				procedure,
			});
		} catch (error) {
			console.error("Update procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.delete(
	"/catalog/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const procedure = await ProcedureCatalogRepository.findById(
				req.params.id
			);

			if (!procedure) {
				return res.status(404).json({ message: "Procedure not found" });
			}

			const usageCount = await PatientProcedureRepository.countDocuments({
				procedure: req.params.id,
			});
			if (usageCount > 0) {
				return res.status(400).json({
					message: `Cannot delete procedure. It is used in ${usageCount} patient procedure(s).`,
				});
			}

			await ProcedureCatalogRepository.delete(req.params.id);

			res.json({ message: "Procedure deleted successfully" });
		} catch (error) {
			console.error("Delete procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get("/", authenticateToken, requireDoctorOrAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			patient,
			doctor,
			status,
			dateFrom,
			dateTo,
			sortBy = "performedDateTime",
			sortOrder = "desc",
		} = req.query;

		const query = {};
		if (patient) query.patient = patient;
		if (doctor) query.doctor = doctor;
		if (status) query.status = status;

		if (dateFrom || dateTo) {
			query.performedDateTime = {};
			if (dateFrom) query.performedDateTime.$gte = new Date(dateFrom);
			if (dateTo) query.performedDateTime.$lte = new Date(dateTo);
		}

		if (req.user.role === "doctor" && req.user.doctor) {
			query.doctor = req.user.doctor._id;
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
});

router.get(
	"/:id",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const procedure = await PatientProcedureRepository.findById(
				req.params.id
			);

			if (!procedure) {
				return res.status(404).json({ message: "Procedure not found" });
			}

			if (
				req.user.role === "doctor" &&
				req.user.doctor &&
				procedure.doctor._id.toString() !== req.user.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ message: "Access denied to this procedure" });
			}

			res.json(procedure);
		} catch (error) {
			console.error("Get procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.put(
	"/:id",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const procedure = await PatientProcedureRepository.findById(
				req.params.id
			);

			if (!procedure) {
				return res.status(404).json({ message: "Procedure not found" });
			}

			if (
				req.user.role === "doctor" &&
				req.user.doctor &&
				procedure.doctor.toString() !== req.user.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ message: "Access denied to modify this procedure" });
			}

			const allowedFields = [
				"status",
				"statusReason",
				"category",
				"code",
				"performedDateTime",
				"performedPeriod",
				"scheduledDateTime",
				"scheduledPeriod",
				"location",
				"reasonCode",
				"bodySite",
				"outcome",
				"report",
				"complication",
				"followUp",
				"note",
				"cost",
			];

			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					procedure[field] = req.body[field];
				}
			});

			await PatientProcedureRepository.update(procedure._id, procedure);

			const updatedProcedure = await PatientProcedureRepository.findById(
				procedure._id
			);

			res.json({
				message: "Procedure updated successfully",
				procedure: updatedProcedure,
			});
		} catch (error) {
			console.error("Update procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.delete(
	"/:id",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const procedure = await PatientProcedureRepository.findById(
				req.params.id
			);

			if (!procedure) {
				return res.status(404).json({ message: "Procedure not found" });
			}

			if (
				req.user.role === "doctor" &&
				req.user.doctor &&
				procedure.doctor.toString() !== req.user.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ message: "Access denied to delete this procedure" });
			}

			await PatientProcedureRepository.delete(req.params.id);

			res.json({ message: "Procedure deleted successfully" });
		} catch (error) {
			console.error("Delete procedure error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/stats/summary",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const { doctor, dateFrom, dateTo } = req.query;

			let query = {};
			if (doctor) query.doctor = doctor;
			if (req.user.role === "doctor" && req.user.doctor) {
				query.doctor = req.user.doctor._id;
			}

			if (dateFrom || dateTo) {
				query.performedDateTime = {};
				if (dateFrom) query.performedDateTime.$gte = new Date(dateFrom);
				if (dateTo) query.performedDateTime.$lte = new Date(dateTo);
			}

			const totalProcedures = await PatientProcedureRepository.countDocuments(
				query
			);

			const proceduresByStatus = await PatientProcedureRepository.aggregate([
				{ $match: query },
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			]);

			const proceduresByCategory = await PatientProcedureRepository.aggregate([
				{ $match: query },
				{
					$lookup: {
						from: "procedurecatalogs",
						localField: "procedure",
						foreignField: "_id",
						as: "procedureInfo",
					},
				},
				{ $unwind: "$procedureInfo" },
				{
					$group: {
						_id: "$procedureInfo.category.coding.code",
						count: { $sum: 1 },
						category: { $first: "$procedureInfo.category.coding.display" },
					},
				},
			]);

			const mostCommonProcedures = await PatientProcedureRepository.aggregate([
				{ $match: query },
				{
					$group: {
						_id: "$procedure",
						count: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: "procedurecatalogs",
						localField: "_id",
						foreignField: "_id",
						as: "procedureInfo",
					},
				},
				{ $unwind: "$procedureInfo" },
				{
					$project: {
						count: 1,
						code: "$procedureInfo.code.coding.code",
						display: "$procedureInfo.code.coding.display",
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 },
			]);

			res.json({
				totalProcedures,
				proceduresByStatus: proceduresByStatus.reduce((acc, curr) => {
					acc[curr._id] = curr.count;
					return acc;
				}, {}),
				proceduresByCategory,
				mostCommonProcedures,
			});
		} catch (error) {
			console.error("Get procedure stats error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

export default router;
