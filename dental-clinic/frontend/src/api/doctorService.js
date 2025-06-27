import apiService from "./apiService";

const doctorService = {
	getAllDoctors: async () => {
		try {
			const response = await apiService.get("/doctors");
			return response.data.doctors;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch doctors" };
		}
	},

	getDoctorById: async (id) => {
		try {
			const response = await apiService.get(`/doctors/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch doctor" };
		}
	},

	getDoctorByUserId: async (userId) => {
		try {
			const response = await apiService.get(`/doctors/user/${userId}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch doctor profile" }
			);
		}
	},

	createDoctor: async (doctorData) => {
		try {
			const response = await apiService.post("/doctors", doctorData);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to create doctor profile" }
			);
		}
	},

	updateDoctor: async (id, doctorData) => {
		try {
			const response = await apiService.put(`/doctors/${id}`, doctorData);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to update doctor profile" }
			);
		}
	},

	deleteDoctor: async (id) => {
		try {
			const response = await apiService.delete(`/doctors/${id}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to delete doctor profile" }
			);
		}
	},

	updateWorkHours: async (id, workHours) => {
		try {
			const response = await apiService.put(`/doctors/${id}/work-hours`, {
				workHours,
			});
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update work hours" };
		}
	},

	getFutureAppointments: async (doctorId) => {
		try {
			const response = await apiService.get(
				`/doctors/${doctorId}/future-appointments`
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch future appointments",
				}
			);
		}
	},

	getPastAppointments: async (doctorId) => {
		try {
			const response = await apiService.get(
				`/doctors/${doctorId}/past-appointments`
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch past appointments" }
			);
		}
	},

	updateAppointmentStatus: async (appointmentId, status) => {
		try {
			const response = await apiService.put(
				`/interventions/appointments/${appointmentId}/status`,
				{
					state: status,
				}
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to update appointment status",
				}
			);
		}
	},

	addAppointmentNotes: async (appointmentId, notes) => {
		try {
			const response = await apiService.put(
				`/interventions/${appointmentId}/notes`,
				{ notes }
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to add appointment notes" }
			);
		}
	},

	getDoctorPatients: async (doctorId) => {
		try {
			const response = await apiService.get(`/doctors/${doctorId}/patients`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch doctor patients" }
			);
		}
	},
};

export default doctorService;
