import ProcedureCatalogRepository from "../repositories/ProcedureCatalogRepository.js";

class ProcedureController {
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

			const procedures = await ProcedureCatalogRepository.findAll(
				query,
				options
			);
			const totalCount = await ProcedureCatalogRepository.count(query);

			res.json({
				success: true,
				data: procedures,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get procedures error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving procedures",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;

			const procedure = await ProcedureCatalogRepository.findById(id);

			if (!procedure) {
				return res.status(404).json({
					success: false,
					message: "Procedure not found",
				});
			}

			res.json({
				success: true,
				data: procedure,
			});
		} catch (error) {
			console.error("Get procedure by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving procedure",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can create procedures",
				});
			}

			const procedureData = req.body;
			if (procedureData.coding && procedureData.coding.length > 0) {
				const existingProcedure = await ProcedureCatalogRepository.findOne({
					"coding.code": procedureData.coding[0].code,
					"coding.system": procedureData.coding[0].system,
				});

				if (existingProcedure) {
					return res.status(400).json({
						success: false,
						message: "Procedure with this code already exists",
					});
				}
			}

			const savedProcedure = await ProcedureCatalogRepository.create(
				procedureData
			);

			res.status(201).json({
				success: true,
				message: "Procedure created successfully",
				data: savedProcedure,
			});
		} catch (error) {
			console.error("Create procedure error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating procedure",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can update procedures",
				});
			}

			const { id } = req.params;
			const updateData = req.body;
			const procedure = await ProcedureCatalogRepository.update(id, updateData);

			if (!procedure) {
				return res.status(404).json({
					success: false,
					message: "Procedure not found",
				});
			}

			res.json({
				success: true,
				message: "Procedure updated successfully",
				data: procedure,
			});
		} catch (error) {
			console.error("Update procedure error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating procedure",
				error: error.message,
			});
		}
	}

	async delete(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can delete procedures",
				});
			}

			const { id } = req.params;

			const procedure = await ProcedureCatalogRepository.findById(id);

			if (!procedure) {
				return res.status(404).json({
					success: false,
					message: "Procedure not found",
				});
			}

			await ProcedureCatalogRepository.delete(id);

			if (!procedure) {
				return res.status(404).json({
					success: false,
					message: "Procedure not found",
				});
			}

			res.json({
				success: true,
				message: "Procedure deleted successfully",
			});
		} catch (error) {
			console.error("Delete procedure error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting procedure",
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

			const procedures = await ProcedureCatalogRepository.findAll(
				query,
				options
			);

			res.json({
				success: true,
				data: procedures,
			});
		} catch (error) {
			console.error("Search procedures error:", error);
			res.status(500).json({
				success: false,
				message: "Error searching procedures",
				error: error.message,
			});
		}
	}

	async getCategories(req, res) {
		try {
			const categories = await ProcedureCatalogRepository.distinct("category");

			res.json({
				success: true,
				data: categories.filter((cat) => cat),
			});
		} catch (error) {
			console.error("Get procedure categories error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving procedure categories",
				error: error.message,
			});
		}
	}

	async importProcedures(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can import procedures",
				});
			}

			const { procedures } = req.body;

			if (!Array.isArray(procedures)) {
				return res.status(400).json({
					success: false,
					message: "Procedures must be an array",
				});
			}

			const results = {
				imported: 0,
				skipped: 0,
				errors: [],
			};

			for (const procedureData of procedures) {
				try {
					const existingProcedure = await ProcedureCatalogRepository.findOne({
						"coding.code": procedureData.coding?.[0]?.code,
						"coding.system": procedureData.coding?.[0]?.system,
					});

					if (existingProcedure) {
						results.skipped++;
						continue;
					}

					await ProcedureCatalogRepository.create(procedureData);
					results.imported++;
				} catch (error) {
					results.errors.push({
						procedure: procedureData.display || "Unknown",
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
			console.error("Import procedures error:", error);
			res.status(500).json({
				success: false,
				message: "Error importing procedures",
				error: error.message,
			});
		}
	}

	async exportProcedures(req, res) {
		try {
			const procedures = await ProcedureCatalogRepository.findAll({
				active: true,
			});

			res.json({
				success: true,
				data: procedures,
				exportDate: new Date().toISOString(),
				count: procedures.length,
			});
		} catch (error) {
			console.error("Export procedures error:", error);
			res.status(500).json({
				success: false,
				message: "Error exporting procedures",
				error: error.message,
			});
		}
	}
}

export default new ProcedureController();
