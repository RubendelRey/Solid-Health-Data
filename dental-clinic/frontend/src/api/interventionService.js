import apiService from "./apiService";

const interventionService = {
	getAllInterventions: async () => {
		try {
			const response = await apiService.get("/interventions");
			return response.data.interventions;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch interventions" }
			);
		}
	},

	getInterventionById: async (id) => {
		try {
			const response = await apiService.get(`/interventions/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch intervention" };
		}
	},

	getInterventionsByPatient: async (patientId) => {
		try {
			const response = await apiService.get(
				`/interventions/patient/${patientId}`
			);
			return response.data.interventions;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch patient interventions",
				}
			);
		}
	},

	createIntervention: async (interventionData) => {
		try {
			const response = await apiService.post(
				"/interventions",
				interventionData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to create intervention" }
			);
		}
	},

	updateIntervention: async (id, interventionData) => {
		try {
			const response = await apiService.put(
				`/interventions/${id}`,
				interventionData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to update intervention" }
			);
		}
	},

	deleteIntervention: async (id) => {
		try {
			const response = await apiService.delete(`/interventions/${id}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to delete intervention" }
			);
		}
	},

	getAvailableAppointmentSlots: async (doctorId, date, interventionTypeId) => {
		try {
			const response = await apiService.get(
				"/interventions/appointments/available",
				{
					params: { doctorId, date, interventionTypeId },
				}
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch available slots" }
			);
		}
	},

	checkDoctorAvailability: async (doctorId, dateTime, interventionTypeId) => {
		try {
			const response = await apiService.get(
				"/interventions/appointments/check-availability",
				{
					params: { doctorId, dateTime, interventionTypeId },
				}
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to check doctor availability",
				}
			);
		}
	},

	scheduleAppointment: async (appointmentData) => {
		try {
			const response = await apiService.post(
				"/interventions/appointments",
				appointmentData
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to schedule appointment" }
			);
		}
	},

	cancelAppointment: async (appointmentId) => {
		try {
			const response = await apiService.put(
				`/interventions/appointments/${appointmentId}/cancel`
			);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to cancel appointment" };
		}
	},

	rescheduleAppointment: async (appointmentId, newDate) => {
		try {
			const response = await apiService.put(
				`/interventions/appointments/${appointmentId}/reschedule`,
				{
					appointmentDate: newDate,
				}
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to reschedule appointment" }
			);
		}
	},

	getUpcomingAppointments: async (patientId) => {
		try {
			const response = await apiService.get(
				`/interventions/appointments/patient/${patientId}/upcoming`
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch upcoming appointments",
				}
			);
		}
	},

	getPastAppointments: async (patientId) => {
		try {
			const response = await apiService.get(
				`/interventions/appointments/patient/${patientId}/past`
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch past appointments" }
			);
		}
	},

	getInterventionsByDoctor: async (doctorId) => {
		try {
			const response = await apiService.get(
				`/interventions/doctor/${doctorId}`
			);
			return response.data.interventions;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch doctor interventions",
				}
			);
		}
	},

	getDoctorAppointments: async (
		doctorId,
		status = "all",
		page = null,
		limit = null
	) => {
		try {
			const params = { status };
			if (page !== null) params.page = page;
			if (limit !== null) params.limit = limit;

			const response = await apiService.get(
				`/interventions/appointments/doctor/${doctorId}`,
				{ params }
			);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch doctor appointments",
				}
			);
		}
	},

	getPatientAppointments: async (
		patientId,
		status = "all",
		page = null,
		limit = null
	) => {
		try {
			const params = { status };
			if (page !== null) params.page = page;
			if (limit !== null) params.limit = limit;

			const response = await apiService.get(
				`/interventions/appointments/patient/${patientId}`,
				{ params }
			);
			return response.data.appointments;
		} catch (error) {
			throw (
				error.response?.data || {
					message: "Failed to fetch patient appointments",
				}
			);
		}
	},

	searchDoctorPatients: async (
		doctorId,
		searchParams = {},
		appointmentType = "all",
		page = null,
		limit = null
	) => {
		try {
			const params = {
				...searchParams,
				appointmentType,
			};

			if (page !== null) params.page = page;
			if (limit !== null) params.limit = limit;

			const response = await apiService.get(
				`/interventions/doctor/${doctorId}/patients`,
				{ params }
			);

			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to search for patients" }
			);
		}
	},
};

export default interventionService;
