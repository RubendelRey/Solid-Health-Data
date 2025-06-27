import apiService from "./apiService";

const allergyService = {
	getAllAllergies: async () => {
		try {
			const response = await apiService.get("/allergies");

			if (response.data && "data" in response.data) {
				return response.data.data;
			}
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch allergies" };
		}
	},

	getAllergyById: async (id) => {
		try {
			const response = await apiService.get(`/allergies/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch allergy" };
		}
	},

	createAllergy: async (allergyData) => {
		try {
			const response = await apiService.post("/allergies", allergyData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to create allergy" };
		}
	},

	updateAllergy: async (id, allergyData) => {
		try {
			const response = await apiService.put(`/allergies/${id}`, allergyData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update allergy" };
		}
	},

	deleteAllergy: async (id) => {
		try {
			const response = await apiService.delete(`/allergies/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete allergy" };
		}
	},

	getAllAllergiesWithCount: async () => {
		try {
			const response = await apiService.get("/allergies");

			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch allergies" };
		}
	},

	getAllergiesByType: async (type) => {
		try {
			const response = await apiService.get(`/allergies/type/${type}`);
			if (response.data && "data" in response.data) {
				return response.data.data;
			}
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: `Failed to fetch allergies of type ${type}`,
				}
			);
		}
	},
};

export default allergyService;
