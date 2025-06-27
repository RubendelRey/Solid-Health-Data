import BaseRepository from "./BaseRepository.js";

class AllergyCatalogRepository extends BaseRepository {
	constructor() {
		super("allergyCatalog");
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

	async searchAllergies(searchTerm, options = {}) {
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
			console.error("Error in searchAllergies:", error);
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

	async findBySeverity(severity, options = {}) {
		try {
			return await this.findAll({ severity }, options);
		} catch (error) {
			console.error("Error in findBySeverity:", error);
			throw error;
		}
	}

	async findActiveAllergies(options = {}) {
		try {
			return await this.findAll({ isActive: true }, options);
		} catch (error) {
			console.error("Error in findActiveAllergies:", error);
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

	async getSeverityLevels() {
		try {
			const collection = await this.getCollection();
			return await collection.distinct("severity");
		} catch (error) {
			console.error("Error in getSeverityLevels:", error);
			throw error;
		}
	}

	async getMostCommonAllergies(limit = 10) {
		try {
			const pipeline = [
				{
					$lookup: {
						from: "patientAllergies",
						localField: "_id",
						foreignField: "allergyId",
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
						severity: 1,
						usageCount: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getMostCommonAllergies:", error);
			throw error;
		}
	}

	async deactivateAllergy(allergyId) {
		try {
			return await this.update(allergyId, { isActive: false });
		} catch (error) {
			console.error("Error in deactivateAllergy:", error);
			throw error;
		}
	}

	async activateAllergy(allergyId) {
		try {
			return await this.update(allergyId, { isActive: true });
		} catch (error) {
			console.error("Error in activateAllergy:", error);
			throw error;
		}
	}
}

export default new AllergyCatalogRepository();
