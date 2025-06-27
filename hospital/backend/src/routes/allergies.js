import express from "express";
import {
	authenticateToken,
	requireAdmin,
	requireDoctorOrAdmin,
} from "../middleware/auth.js";
import AllergyCatalogRepository from "../repositories/AllergyCatalogRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

const allergyCatalogRepository = AllergyCatalogRepository;
const patientAllergyRepository = PatientAllergyRepository;
const patientRepository = PatientRepository;
const userRepository = UserRepository;

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
			query.category = category;
		}

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const allergies = await allergyCatalogRepository.find(query);

		const total = await allergyCatalogRepository.count(query);

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
		console.error("Get allergy catalog error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/catalog/:id", authenticateToken, async (req, res) => {
	try {
		const allergy = await allergyCatalogRepository.findById(req.params.id);

		if (!allergy) {
			return res.status(404).json({ message: "Allergy not found" });
		}

		res.json(allergy);
	} catch (error) {
		console.error("Get allergy error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.post("/catalog", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const allergy = await allergyCatalogRepository.create(req.body);

		res.status(201).json({
			message: "Allergy created successfully",
			allergy,
		});
	} catch (error) {
		console.error("Create allergy error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.put(
	"/catalog/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const allergy = await allergyCatalogRepository.findById(req.params.id);

			if (!allergy) {
				return res.status(404).json({ message: "Allergy not found" });
			}

			const allowedFields = [
				"code",
				"category",
				"criticality",
				"type",
				"description",
				"status",
				"verificationStatus",
				"manifestation",
				"severity",
			];

			const updateData = {};
			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					updateData[field] = req.body[field];
				}
			});

			const updatedAllergy = await allergyCatalogRepository.update(
				req.params.id,
				updateData
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
	"/catalog/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const allergy = await allergyCatalogRepository.findById(req.params.id);

			if (!allergy) {
				return res.status(404).json({ message: "Allergy not found" });
			}

			const usageCount = await patientAllergyRepository.count({
				allergy: req.params.id,
			});
			if (usageCount > 0) {
				return res.status(400).json({
					message: `Cannot delete allergy. It is used in ${usageCount} patient allergy record(s).`,
				});
			}

			await allergyCatalogRepository.delete(req.params.id);

			res.json({ message: "Allergy deleted successfully" });
		} catch (error) {
			console.error("Delete allergy error:", error);
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
			status,
			category,
			criticality,
			sortBy = "recordedDate",
			sortOrder = "desc",
		} = req.query;

		const query = {};
		if (patient) query.patient = patient;
		if (status) query["clinicalStatus.coding.code"] = status;
		if (category) query.category = category;
		if (criticality) query.criticality = criticality;

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const allergies = await patientAllergyRepository.findWithPagination(
			query,
			skip,
			parseInt(limit),
			sort
		);

		for (let allergy of allergies) {
			if (allergy.patient) {
				const patient = await patientRepository.findById(allergy.patient);
				if (patient) {
					allergy.patient = {
						name: patient.name,
						identifier: patient.identifier,
					};
				}
			}
			if (allergy.allergy) {
				const allergyData = await allergyCatalogRepository.findById(
					allergy.allergy
				);
				if (allergyData) {
					allergy.allergy = {
						code: allergyData.code,
						description: allergyData.description,
						category: allergyData.category,
						criticality: allergyData.criticality,
					};
				}
			}
			if (allergy.recorder) {
				const user = await userRepository.findById(allergy.recorder);
				if (user) {
					allergy.recorder = {
						email: user.email,
						profile: user.profile,
					};
				}
			}
		}

		const total = await patientAllergyRepository.count(query);

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
});

router.get(
	"/:id",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const allergy = await patientAllergyRepository.findById(req.params.id);

			if (!allergy) {
				return res.status(404).json({ message: "Patient allergy not found" });
			}

			if (allergy.patient) {
				const patient = await patientRepository.findById(allergy.patient);
				if (patient) {
					allergy.patient = {
						name: patient.name,
						identifier: patient.identifier,
						telecom: patient.telecom,
					};
				}
			}
			if (allergy.allergy) {
				const allergyData = await allergyCatalogRepository.findById(
					allergy.allergy
				);
				if (allergyData) {
					allergy.allergy = {
						code: allergyData.code,
						description: allergyData.description,
						category: allergyData.category,
						criticality: allergyData.criticality,
						manifestation: allergyData.manifestation,
					};
				}
			}
			if (allergy.recorder) {
				const user = await userRepository.findById(allergy.recorder);
				if (user) {
					allergy.recorder = {
						email: user.email,
						profile: user.profile,
					};
				}
			}
			if (allergy.asserter) {
				const user = await userRepository.findById(allergy.asserter);
				if (user) {
					allergy.asserter = {
						email: user.email,
						profile: user.profile,
					};
				}
			}

			res.json(allergy);
		} catch (error) {
			console.error("Get patient allergy error:", error);
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
			const allergy = await patientAllergyRepository.findById(req.params.id);

			if (!allergy) {
				return res.status(404).json({ message: "Patient allergy not found" });
			}

			const allowedFields = [
				"clinicalStatus",
				"criticality",
			];

			const updateData = {};
			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					updateData[field] = req.body[field];
				}
			});

			const updatedAllergy = await patientAllergyRepository.update(
				req.params.id,
				updateData
			);

			if (updatedAllergy.patient) {
				const patient = await patientRepository.findById(
					updatedAllergy.patient
				);
				if (patient) {
					updatedAllergy.patient = {
						name: patient.name,
						identifier: patient.identifier,
					};
				}
			}
			if (updatedAllergy.allergy) {
				const allergyData = await allergyCatalogRepository.findById(
					updatedAllergy.allergy
				);
				if (allergyData) {
					updatedAllergy.allergy = {
						code: allergyData.code,
						description: allergyData.description,
						category: allergyData.category,
					};
				}
			}
			if (updatedAllergy.recorder) {
				const user = await userRepository.findById(updatedAllergy.recorder);
				if (user) {
					updatedAllergy.recorder = {
						email: user.email,
						profile: user.profile,
					};
				}
			}

			res.json({
				message: "Patient allergy updated successfully",
				allergy: updatedAllergy,
			});
		} catch (error) {
			console.error("Update patient allergy error:", error);
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
			const allergy = await patientAllergyRepository.findById(req.params.id);

			if (!allergy) {
				return res.status(404).json({ message: "Patient allergy not found" });
			}

			await patientAllergyRepository.delete(req.params.id);

			res.json({ message: "Patient allergy deleted successfully" });
		} catch (error) {
			console.error("Delete patient allergy error:", error);
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
			const totalAllergies = await patientAllergyRepository.count({});

			const allergiesByStatus = await patientAllergyRepository.aggregate([
				{
					$group: {
						_id: "$clinicalStatus.coding.code",
						count: { $sum: 1 },
					},
				},
			]);

			const allergiesByCategory = await patientAllergyRepository.aggregate([
				{ $unwind: "$category" },
				{
					$group: {
						_id: "$category",
						count: { $sum: 1 },
					},
				},
			]);

			const allergiesByCriticality = await patientAllergyRepository.aggregate([
				{
					$group: {
						_id: "$criticality",
						count: { $sum: 1 },
					},
				},
			]);

			const mostCommonAllergies = await patientAllergyRepository.aggregate([
				{
					$group: {
						_id: "$allergy",
						count: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: "allergycatalogs",
						localField: "_id",
						foreignField: "_id",
						as: "allergyInfo",
					},
				},
				{ $unwind: "$allergyInfo" },
				{
					$project: {
						count: 1,
						code: "$allergyInfo.code.coding.code",
						display: "$allergyInfo.code.coding.display",
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 },
			]);

			const patientsWithMultipleAllergies =
				await patientAllergyRepository.aggregate([
					{
						$group: {
							_id: "$patient",
							allergyCount: { $sum: 1 },
						},
					},
					{
						$match: {
							allergyCount: { $gt: 1 },
						},
					},
					{
						$lookup: {
							from: "patients",
							localField: "_id",
							foreignField: "_id",
							as: "patientInfo",
						},
					},
					{ $unwind: "$patientInfo" },
					{
						$project: {
							allergyCount: 1,
							patientName: "$patientInfo.name",
							patientId: "$patientInfo._id",
						},
					},
					{ $sort: { allergyCount: -1 } },
					{ $limit: 10 },
				]);

			res.json({
				totalAllergies,
				allergiesByStatus: allergiesByStatus.reduce((acc, curr) => {
					acc[curr._id || "unknown"] = curr.count;
					return acc;
				}, {}),
				allergiesByCategory: allergiesByCategory.reduce((acc, curr) => {
					acc[curr._id] = curr.count;
					return acc;
				}, {}),
				allergiesByCriticality: allergiesByCriticality.reduce((acc, curr) => {
					acc[curr._id] = curr.count;
					return acc;
				}, {}),
				mostCommonAllergies,
				patientsWithMultipleAllergies,
			});
		} catch (error) {
			console.error("Get allergy stats error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/patient/:patientId/report",
	authenticateToken,
	requireDoctorOrAdmin,
	async (req, res) => {
		try {
			const patientId = req.params.patientId;

			const allergies = await patientAllergyRepository.find({
				patient: patientId,
			});

			for (let allergy of allergies) {
				if (allergy.allergy) {
					const allergyData = await allergyCatalogRepository.findById(
						allergy.allergy
					);
					if (allergyData) {
						allergy.allergy = {
							code: allergyData.code,
							description: allergyData.description,
							category: allergyData.category,
							criticality: allergyData.criticality,
							manifestation: allergyData.manifestation,
						};
					}
				}
				if (allergy.recorder) {
					const user = await userRepository.findById(allergy.recorder);
					if (user) {
						allergy.recorder = {
							email: user.email,
							profile: user.profile,
						};
					}
				}
			}

			allergies.sort(
				(a, b) => new Date(b.recordedDate) - new Date(a.recordedDate)
			);

			const activeAllergies = allergies.filter(
				(a) => a.clinicalStatus?.coding?.[0]?.code === "active"
			);

			const criticalAllergies = allergies.filter(
				(a) => a.criticality === "high"
			);

			const allergiesByCategory = allergies.reduce((acc, allergy) => {
				if (allergy.category) {
					allergy.category.forEach((cat) => {
						acc[cat] = acc[cat] || [];
						acc[cat].push(allergy);
					});
				}
				return acc;
			}, {});

			res.json({
				patientId,
				totalAllergies: allergies.length,
				activeAllergies: activeAllergies.length,
				criticalAllergies: criticalAllergies.length,
				allergies,
				allergiesByCategory,
				lastUpdated: allergies.length > 0 ? allergies[0].recordedDate : null,
			});
		} catch (error) {
			console.error("Get patient allergy report error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

export default router;
