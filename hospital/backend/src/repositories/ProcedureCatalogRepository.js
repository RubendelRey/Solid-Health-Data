import BaseRepository from "./BaseRepository.js";

class ProcedureCatalogRepository extends BaseRepository {
	constructor() {
		super("procedureCatalog");
	}

	async findByCode(code) {
		try {
			return await this.findOne({ code });
		} catch (error) {
			console.error("Error in findByCode:", error);
			throw error;
		}
	}

	async findByName(name) {
		try {
			return await this.findOne({ name });
		} catch (error) {
			console.error("Error in findByName:", error);
			throw error;
		}
	}

	async searchProcedures(searchTerm, options = {}) {
		try {
			const query = {
				$or: [
					{ name: { $regex: searchTerm, $options: "i" } },
					{ description: { $regex: searchTerm, $options: "i" } },
					{ code: { $regex: searchTerm, $options: "i" } },
					{ category: { $regex: searchTerm, $options: "i" } },
				],
			};
			return await this.findAll(query, options);
		} catch (error) {
			console.error("Error in searchProcedures:", error);
			throw error;
		}
	}

	async findByCategory(category, options = {}) {
		try {
			return await this.findAll({ category }, options);
		} catch (error) {
			console.error("Error in findByCategory:", error);
			throw error;
		}
	}

	async findActiveProcedures(options = {}) {
		try {
			return await this.findAll({ isActive: true }, options);
		} catch (error) {
			console.error("Error in findActiveProcedures:", error);
			throw error;
		}
	}

	async getCategories() {
		try {
			const collection = await this.getCollection();
			return await collection.distinct("category");
		} catch (error) {
			console.error("Error in getCategories:", error);
			throw error;
		}
	}

	async getMostUsedProcedures(limit = 10) {
		try {
			const pipeline = [
				{
					$lookup: {
						from: "patientProcedures",
						localField: "_id",
						foreignField: "procedureId",
						as: "usages",
					},
				},
				{
					$addFields: {
						usageCount: { $size: "$usages" },
					},
				},
				{
					$sort: { usageCount: -1 },
				},
				{
					$limit: limit,
				},
				{
					$project: {
						name: 1,
						description: 1,
						code: 1,
						category: 1,
						usageCount: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getMostUsedProcedures:", error);
			throw error;
		}
	}

	async deactivateProcedure(procedureId) {
		try {
			return await this.update(procedureId, { isActive: false });
		} catch (error) {
			console.error("Error in deactivateProcedure:", error);
			throw error;
		}
	}

	async activateProcedure(procedureId) {
		try {
			return await this.update(procedureId, { isActive: true });
		} catch (error) {
			console.error("Error in activateProcedure:", error);
			throw error;
		}
	}
}

export default new ProcedureCatalogRepository();
