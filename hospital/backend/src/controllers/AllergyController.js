import AllergyCatalogRepository from "../repositories/AllergyCatalogRepository.js";

class AllergyController {
	async getAll(req, res) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				category,
				active = true,
			} = req.query;
			const skip = (page - 1) * limit;

			let query = {};
			if (search) {
				query.$or = [
					{ display: { $regex: search, $options: "i" } },
					{ "coding.display": { $regex: search, $options: "i" } },
					{ "coding.code": { $regex: search, $options: "i" } },
				];
			}
			if (category) {
				query.category = category;
			}
			if (active !== undefined) {
				query.active = active === "true";
			}
			const options = {
				sort: { display: 1 },
				limit: parseInt(limit),
				skip,
			};

			const allergies = await AllergyCatalogRepository.findAll(query, options);
			const totalCount = await AllergyCatalogRepository.count(query);

			res.json({
				success: true,
				data: allergies,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get allergies error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving allergies",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;

			const allergy = await AllergyCatalogRepository.findById(id);

			if (!allergy) {
				return res.status(404).json({
					success: false,
					message: "Allergy not found",
				});
			}

			res.json({
				success: true,
				data: allergy,
			});
		} catch (error) {
			console.error("Get allergy by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving allergy",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can create allergies",
				});
			}

			const allergyData = req.body;
			if (allergyData.coding && allergyData.coding.length > 0) {
				const existingAllergy = await AllergyCatalogRepository.findOne({
					"coding.code": allergyData.coding[0].code,
					"coding.system": allergyData.coding[0].system,
				});

				if (existingAllergy) {
					return res.status(400).json({
						success: false,
						message: "Allergy with this code already exists",
					});
				}
			}

			const savedAllergy = await AllergyCatalogRepository.create(allergyData);

			res.status(201).json({
				success: true,
				message: "Allergy created successfully",
				data: savedAllergy,
			});
		} catch (error) {
			console.error("Create allergy error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating allergy",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can update allergies",
				});
			}

			const { id } = req.params;
			const updateData = req.body;
			const allergy = await AllergyCatalogRepository.update(id, updateData);

			if (!allergy) {
				return res.status(404).json({
					success: false,
					message: "Allergy not found",
				});
			}

			res.json({
				success: true,
				message: "Allergy updated successfully",
				data: allergy,
			});
		} catch (error) {
			console.error("Update allergy error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating allergy",
				error: error.message,
			});
		}
	}

	async delete(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can delete allergies",
				});
			}

			const { id } = req.params;

			const allergy = await AllergyCatalogRepository.findById(id);

			if (!allergy) {
				return res.status(404).json({
					success: false,
					message: "Allergy not found",
				});
			}

			await AllergyCatalogRepository.delete(id);
			return res.json({
				success: true,
				message: "Allergy deleted successfully",
			});
		} catch (error) {
			console.error("Delete allergy error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting allergy",
				error: error.message,
			});
		}
	}

	async search(req, res) {
		try {
			const { q: searchTerm, limit = 20 } = req.query;

			if (!searchTerm) {
				return res.status(400).json({
					success: false,
					message: "Search term is required",
				});
			}
			const query = {
				$or: [
					{ display: { $regex: searchTerm, $options: "i" } },
					{ "coding.display": { $regex: searchTerm, $options: "i" } },
					{ "coding.code": { $regex: searchTerm, $options: "i" } },
				],
				active: true,
			};

			const options = {
				sort: { display: 1 },
				limit: parseInt(limit),
			};

			const allergies = await AllergyCatalogRepository.findAll(query, options);

			res.json({
				success: true,
				data: allergies,
			});
		} catch (error) {
			console.error("Search allergies error:", error);
			res.status(500).json({
				success: false,
				message: "Error searching allergies",
				error: error.message,
			});
		}
	}

	async getCategories(req, res) {
		try {
			const categories = await AllergyCatalogRepository.distinct("category");

			res.json({
				success: true,
				data: categories.filter((cat) => cat),
			});
		} catch (error) {
			console.error("Get allergy categories error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving allergy categories",
				error: error.message,
			});
		}
	}

	async getSeverityLevels(req, res) {
		try {
			const severityLevels = [
				{ code: "mild", display: "Mild" },
				{ code: "moderate", display: "Moderate" },
				{ code: "severe", display: "Severe" },
				{ code: "unable-to-assess", display: "Unable to assess" },
			];

			res.json({
				success: true,
				data: severityLevels,
			});
		} catch (error) {
			console.error("Get severity levels error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving severity levels",
				error: error.message,
			});
		}
	}

	async importAllergies(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can import allergies",
				});
			}

			const { allergies } = req.body;

			if (!Array.isArray(allergies)) {
				return res.status(400).json({
					success: false,
					message: "Allergies must be an array",
				});
			}

			const results = {
				imported: 0,
				skipped: 0,
				errors: [],
			};

			for (const allergyData of allergies) {
				try {
					const existingAllergy = await AllergyCatalogRepository.findOne({
						"coding.code": allergyData.coding?.[0]?.code,
						"coding.system": allergyData.coding?.[0]?.system,
					});

					if (existingAllergy) {
						results.skipped++;
						continue;
					}

					await AllergyCatalogRepository.create(allergyData);
					results.imported++;
				} catch (error) {
					results.errors.push({
						allergy: allergyData.display || "Unknown",
						error: error.message,
					});
				}
			}

			res.json({
				success: true,
				message: "Import completed",
				data: results,
			});
		} catch (error) {
			console.error("Import allergies error:", error);
			res.status(500).json({
				success: false,
				message: "Error importing allergies",
				error: error.message,
			});
		}
	}

	async exportAllergies(req, res) {
		try {
			const allergies = await AllergyCatalogRepository.findAll({
				active: true,
			});

			res.json({
				success: true,
				data: allergies,
				exportDate: new Date().toISOString(),
				count: allergies.length,
			});
		} catch (error) {
			console.error("Export allergies error:", error);
			res.status(500).json({
				success: false,
				message: "Error exporting allergies",
				error: error.message,
			});
		}
	}
}

export default new AllergyController();
