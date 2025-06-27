import apiService from "./apiService";

const patientService = {
	getAllPatients: async () => {
		try {
			const response = await apiService.get("/patients");

			if (response.data && "patients" in response.data) {
				return response.data.patients;
			}
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch patients" };
		}
	},

	getPatientById: async (id) => {
		try {
			const response = await apiService.get(`/patients/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch patient" };
		}
	},

	createPatient: async (patientData) => {
		try {
			const response = await apiService.post("/patients", patientData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to create patient" };
		}
	},

	updatePatient: async (id, patientData) => {
		try {
			const response = await apiService.put(`/patients/${id}`, patientData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update patient" };
		}
	},

	deletePatient: async (id) => {
		try {
			const response = await apiService.delete(`/patients/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete patient" };
		}
	},

	getPatientsByDoctor: async (doctorId) => {
		try {
			const response = await apiService.get(`/doctors/${doctorId}/patients`);

			if (response.data && "patients" in response.data) {
				return response.data.patients;
			}
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch patients for doctor",
				}
			);
		}
	},

	getAllPatientsWithCount: async () => {
		try {
			const response = await apiService.get("/patients");

			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch patients" };
		}
	},

	getPatientAllergies: async (patientId) => {
		try {
			const response = await apiService.get(`/patients/${patientId}/allergies`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch patient allergies" }
			);
		}
	},

	addAllergyToPatient: async (patientId, allergyData) => {
		try {
			const response = await apiService.post(
				`/patients/${patientId}/allergies`,
				allergyData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to add allergy to patient" }
			);
		}
	},

	updatePatientAllergy: async (patientId, allergyRelationId, allergyData) => {
		try {
			const response = await apiService.put(
				`/patients/${patientId}/allergies/${allergyRelationId}`,
				allergyData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to update patient allergy" }
			);
		}
	},

	updateAllergyStatus: async (patientId, allergyRelationId, status) => {
		try {
			const response = await apiService.patch(
				`/patients/${patientId}/allergies/${allergyRelationId}/status`,
				{ status }
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to update allergy status" }
			);
		}
	},

	removeAllergyFromPatient: async (patientId, allergyRelationId) => {
		try {
			const response = await apiService.delete(
				`/patients/${patientId}/allergies/${allergyRelationId}`
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to remove allergy from patient",
				}
			);
		}
	},

	getPatientsByAllergy: async (allergyId) => {
		try {
			const response = await apiService.get(`/patients/byAllergy/${allergyId}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch patients with this allergy",
				}
			);
		}
	},
};

export default patientService;
