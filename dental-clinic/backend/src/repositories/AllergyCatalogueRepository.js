import BaseRepository from "./BaseRepository.js";

class AllergyCatalogueRepository extends BaseRepository {
	constructor() {
		super("allergyCatalogues");
	}

	async findByCode(code) {
		try {
			return await this.findOne({ code });
		} catch (error) {
			console.error("Error in findByCode:", error);
			throw error;
		}
	}

	async findByType(type, options = {}) {
		try {
			return await this.findAll({ type }, options);
		} catch (error) {
			console.error("Error in findByType:", error);
			throw error;
		}
	}

	async findByText(searchText, options = {}) {
		try {
			const collection = await this.getCollection();

			const indexExists = await collection.indexExists("text_search");
			if (!indexExists) {
				await collection.createIndex({ text: "text" }, { name: "text_search" });
			}

			return await collection
				.find({ $text: { $search: searchText } })
				.sort({ score: { $meta: "textScore" } })
				.limit(options.limit || 100)
				.toArray();
		} catch (error) {
			console.error("Error in findByText:", error);
			throw error;
		}
	}

	async getDistinctCategories() {
		try {
			const collection = await this.getCollection();
			return await collection.distinct("category");
		} catch (error) {
			console.error("Error in getDistinctCategories:", error);
			throw error;
		}
	}

	async codeExists(code) {
		try {
			const allergy = await this.findOne({ code });
			return allergy !== null;
		} catch (error) {
			console.error("Error in codeExists:", error);
			throw error;
		}
	}

	async getCountByCategory() {
		try {
			const pipeline = [
				{
					$group: {
						_id: "$category",
						count: { $sum: 1 },
					},
				},
				{
					$project: {
						category: "$_id",
						count: 1,
						_id: 0,
					},
				},
				{
					$sort: { count: -1 },
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getCountByCategory:", error);
			throw error;
		}
	}
}

export default new AllergyCatalogueRepository();
