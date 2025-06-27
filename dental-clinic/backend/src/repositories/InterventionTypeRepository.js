import BaseRepository from "./BaseRepository.js";

class InterventionTypeRepository extends BaseRepository {
	constructor() {
		super("interventionTypes");
	}

	async findByName(name) {
		try {
			return await this.findOne({ name });
		} catch (error) {
			console.error("Error in findByName:", error);
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

	async findByDurationRange(minDuration, maxDuration, options = {}) {
		try {
			return await this.findAll(
				{
					duration: {
						$gte: minDuration,
						$lte: maxDuration,
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findByDurationRange:", error);
			throw error;
		}
	}

	async findByCostRange(minCost, maxCost, options = {}) {
		try {
			return await this.findAll(
				{
					cost: {
						$gte: minCost,
						$lte: maxCost,
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findByCostRange:", error);
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

	async updateCost(id, cost) {
		try {
			return await this.update(id, { cost });
		} catch (error) {
			console.error("Error in updateCost:", error);
			throw error;
		}
	}

	async updateDuration(id, duration) {
		try {
			return await this.update(id, { duration });
		} catch (error) {
			console.error("Error in updateDuration:", error);
			throw error;
		}
	}
}

export default new InterventionTypeRepository();
