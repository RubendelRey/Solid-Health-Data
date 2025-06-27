import apiService from "./apiService";

const interventionTypeService = {
	getAllInterventionTypes: async () => {
		try {
			const response = await apiService.get("/intervention-types");

			if (response.data && "interventionTypes" in response.data) {
				return response.data.interventionTypes;
			}
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch intervention types",
				}
			);
		}
	},

	getInterventionTypeById: async (id) => {
		try {
			const response = await apiService.get(`/intervention-types/${id}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch intervention type" }
			);
		}
	},

	createInterventionType: async (typeData) => {
		try {
			const response = await apiService.post("/intervention-types", typeData);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to create intervention type",
				}
			);
		}
	},

	updateInterventionType: async (id, typeData) => {
		try {
			const response = await apiService.put(
				`/intervention-types/${id}`,
				typeData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to update intervention type",
				}
			);
		}
	},

	deleteInterventionType: async (id) => {
		try {
			const response = await apiService.delete(`/intervention-types/${id}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to delete intervention type",
				}
			);
		}
	},

	getAllInterventionTypesWithCount: async () => {
		try {
			const response = await apiService.get("/intervention-types");

			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch intervention types",
				}
			);
		}
	},
};

export default interventionTypeService;
