import AllergyCatalogueRepository from "../repositories/AllergyCatalogueRepository.js";

class AllergyCatalogueService {
	async getAllAllergies(query = {}, options = {}) {
		try {
			const allergies = await AllergyCatalogueRepository.findAll(
				query,
				options
			);
			const count = await AllergyCatalogueRepository.count(query);

			return {
				success: true,
				count,
				data: allergies,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async getAllergyById(id) {
		try {
			const allergy = await AllergyCatalogueRepository.findById(id);

			if (!allergy) {
				throw new Error("Allergy not found");
			}

			return {
				success: true,
				data: allergy,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async getAllergyByCode(code) {
		try {
			const allergy = await AllergyCatalogueRepository.findByCode(code);

			if (!allergy) {
				throw new Error("Allergy not found");
			}

			return {
				success: true,
				data: allergy,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}
	async getAllergiesByType(type, options = {}) {
		try {
			const allergies = await AllergyCatalogueRepository.findByType(
				type,
				options
			);
			const count = await AllergyCatalogueRepository.count({ type });

			return {
				success: true,
				count,
				data: allergies,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async createAllergy(allergyData) {
		try {
			const existingAllergy = await AllergyCatalogueRepository.findByCode(
				allergyData.code
			);

			if (existingAllergy) {
				throw new Error("Allergy with this code already exists");
			}

			const allergy = await AllergyCatalogueRepository.create(allergyData);

			return {
				success: true,
				data: allergy,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async updateAllergy(id, allergyData) {
		try {
			if (allergyData.code) {
				const existingAllergy = await AllergyCatalogueRepository.findByCode(
					allergyData.code
				);

				if (existingAllergy && existingAllergy._id.toString() !== id) {
					throw new Error("Allergy with this code already exists");
				}
			}

			const allergy = await AllergyCatalogueRepository.update(id, allergyData);

			if (!allergy) {
				throw new Error("Allergy not found");
			}

			return {
				success: true,
				data: allergy,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async deleteAllergy(id) {
		try {
			const allergy = await AllergyCatalogueRepository.delete(id);

			if (!allergy) {
				throw new Error("Allergy not found");
			}

			return {
				success: true,
				data: {},
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}
}

export default new AllergyCatalogueService();
