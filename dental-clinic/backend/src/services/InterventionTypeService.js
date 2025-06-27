import InterventionTypeRepository from "../repositories/InterventionTypeRepository.js";

class InterventionTypeService {
	async getAllInterventionTypes(query = {}, options = {}) {
		try {
			const interventionTypes = await InterventionTypeRepository.findAll(
				query,
				options
			);
			const count = await InterventionTypeRepository.count(query);

			return {
				count,
				interventionTypes,
			};
		} catch (error) {
			throw error;
		}
	}

	async getInterventionTypeById(id) {
		try {
			const interventionType = await InterventionTypeRepository.findById(id);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			return interventionType;
		} catch (error) {
			throw error;
		}
	}

	async getInterventionTypesByCategory(category, options = {}) {
		try {
			const interventionTypes = await InterventionTypeRepository.findByCategory(
				category,
				options
			);
			const count = await InterventionTypeRepository.count({ category });

			return {
				count,
				interventionTypes,
			};
		} catch (error) {
			throw error;
		}
	}

	async createInterventionType(interventionTypeData) {
		try {
			const existingType = await InterventionTypeRepository.findByName(
				interventionTypeData.name
			);

			if (existingType) {
				throw new Error("Intervention type with this name already exists");
			}

			if (!interventionTypeData.name) {
				throw new Error("Name is required");
			}

			if (!interventionTypeData.category) {
				throw new Error("Category is required");
			}

			if (
				!interventionTypeData.duration ||
				typeof interventionTypeData.duration !== "number" ||
				interventionTypeData.duration <= 0
			) {
				throw new Error(
					"Duration is required and must be a positive number (in minutes)"
				);
			}

			if (
				!interventionTypeData.cost ||
				typeof interventionTypeData.cost !== "number" ||
				interventionTypeData.cost < 0
			) {
				throw new Error("Cost is required and must be a non-negative number");
			}

			const interventionType = await InterventionTypeRepository.create(
				interventionTypeData
			);

			return interventionType;
		} catch (error) {
			throw error;
		}
	}

	async updateInterventionType(id, interventionTypeData) {
		try {
			if (interventionTypeData.name) {
				const existingType = await InterventionTypeRepository.findByName(
					interventionTypeData.name
				);

				if (existingType && existingType._id.toString() !== id) {
					throw new Error("Intervention type with this name already exists");
				}
			}

			if (interventionTypeData.duration !== undefined) {
				if (
					typeof interventionTypeData.duration !== "number" ||
					interventionTypeData.duration <= 0
				) {
					throw new Error("Duration must be a positive number (in minutes)");
				}
			}

			if (interventionTypeData.cost !== undefined) {
				if (
					typeof interventionTypeData.cost !== "number" ||
					interventionTypeData.cost < 0
				) {
					throw new Error("Cost must be a non-negative number");
				}
			}

			const interventionType = await InterventionTypeRepository.update(
				id,
				interventionTypeData
			);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			return interventionType;
		} catch (error) {
			throw error;
		}
	}

	async deleteInterventionType(id) {
		try {
			const interventionType = await InterventionTypeRepository.delete(id);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			return {};
		} catch (error) {
			throw error;
		}
	}

	async getInterventionTypesByDuration(minDuration, maxDuration, options = {}) {
		try {
			const interventionTypes =
				await InterventionTypeRepository.findByDurationRange(
					minDuration,
					maxDuration,
					options
				);

			const count = await InterventionTypeRepository.count({
				duration: { $gte: minDuration, $lte: maxDuration },
			});

			return {
				count,
				interventionTypes,
			};
		} catch (error) {
			throw error;
		}
	}
}

export default new InterventionTypeService();
