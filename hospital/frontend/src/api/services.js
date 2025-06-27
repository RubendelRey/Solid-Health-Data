import api from "./authService";

const handleResponse = (response) => response.data;
const handleError = (error) => {
	console.error("API Error:", error);
	throw error;
};

export const getUsers = () =>
	api.get("/users").then(handleResponse).catch(handleError);
export const getUser = (id) =>
	api.get(`/users/${id}`).then(handleResponse).catch(handleError);
export const createUser = (userData) =>
	api.post("/users", userData).then(handleResponse).catch(handleError);
export const updateUser = (id, userData) =>
	api.put(`/users/${id}`, userData).then(handleResponse).catch(handleError);
export const deleteUser = (id) =>
	api.delete(`/users/${id}`).then(handleResponse).catch(handleError);

export const getPatients = () =>
	api.get("/patients").then(handleResponse).catch(handleError);
export const getPatient = (id) =>
	api.get(`/patients/${id}`).then(handleResponse).catch(handleError);
export const createPatient = (patientData) =>
	api.post("/patients", patientData).then(handleResponse).catch(handleError);
export const updatePatient = (id, patientData) =>
	api
		.put(`/patients/${id}`, patientData)
		.then(handleResponse)
		.catch(handleError);
export const deletePatient = (id) =>
	api.delete(`/patients/${id}`).then(handleResponse).catch(handleError);

export const getPatientProcedures = (patientId) =>
	api
		.get(`/patients/${patientId}/procedures`)
		.then(handleResponse)
		.catch(handleError);
export const addPatientProcedure = (patientId, procedureData) =>
	api
		.post(`/patients/${patientId}/procedures`, procedureData)
		.then(handleResponse)
		.catch(handleError);
export const updatePatientProcedure = (patientId, procedureId, procedureData) =>
	api
		.put(`/patients/${patientId}/procedures/${procedureId}`, procedureData)
		.then(handleResponse)
		.catch(handleError);
export const deletePatientProcedure = (patientId, procedureId) =>
	api
		.delete(`/patients/${patientId}/procedures/${procedureId}`)
		.then(handleResponse)
		.catch(handleError);

export const getPatientAllergies = (patientId) =>
	api
		.get(`/patients/${patientId}/allergies`)
		.then(handleResponse)
		.catch(handleError);
export const addPatientAllergy = (patientId, allergyData) =>
	api
		.post(`/patients/${patientId}/allergies`, allergyData)
		.then(handleResponse)
		.catch(handleError);
export const updatePatientAllergy = (patientId, allergyId, allergyData) =>
	api
		.put(`/patients/${patientId}/allergies/${allergyId}`, allergyData)
		.then(handleResponse)
		.catch(handleError);
export const deletePatientAllergy = (patientId, allergyId) =>
	api
		.delete(`/patients/${patientId}/allergies/${allergyId}`)
		.then(handleResponse)
		.catch(handleError);

export const getPatientAppointments = (patientId) =>
	api
		.get(`/patients/${patientId}/appointments`)
		.then(handleResponse)
		.catch(handleError);
export const requestAppointment = (appointmentData) =>
	api
		.post("/appointments", appointmentData)
		.then(handleResponse)
		.catch(handleError);

export const getDoctors = () =>
	api.get("/doctors").then(handleResponse).catch(handleError);
export const getDoctor = (id) =>
	api.get(`/doctors/${id}`).then(handleResponse).catch(handleError);
export const createDoctor = (doctorData) =>
	api.post("/doctors", doctorData).then(handleResponse).catch(handleError);
export const updateDoctor = (id, doctorData) =>
	api.put(`/doctors/${id}`, doctorData).then(handleResponse).catch(handleError);
export const deleteDoctor = (id) =>
	api.delete(`/doctors/${id}`).then(handleResponse).catch(handleError);

export const getDoctorAppointments = (doctorId, date) => {
	const params = date ? { date } : {};
	return api
		.get(`/doctors/${doctorId}/appointments`, { params })
		.then(handleResponse)
		.catch(handleError);
};
export const getDoctorTodayAppointments = (doctorId) => {
	const today = new Date().toISOString().split("T")[0];
	return api
		.get(`/doctors/${doctorId}/appointments`, { params: { date: today } })
		.then(handleResponse)
		.catch(handleError);
};
export const getDoctorRecentProcedures = (doctorId) =>
	api
		.get(`/doctors/${doctorId}/procedures`)
		.then(handleResponse)
		.catch(handleError);
export const getDoctorProcedures = (doctorId, params = {}) =>
	api
		.get(`/doctors/${doctorId}/procedures`, { params })
		.then(handleResponse)
		.catch(handleError);
export const getDoctorStats = (doctorId) =>
	api.get(`/doctors/${doctorId}/stats`).then(handleResponse).catch(handleError);

export const getAppointments = () =>
	api.get("/appointments").then(handleResponse).catch(handleError);
export const getAppointment = (id) =>
	api.get(`/appointments/${id}`).then(handleResponse).catch(handleError);
export const createAppointment = (appointmentData) =>
	api
		.post("/appointments", appointmentData)
		.then(handleResponse)
		.catch(handleError);
export const updateAppointment = (id, appointmentData) =>
	api
		.put(`/appointments/${id}`, appointmentData)
		.then(handleResponse)
		.catch(handleError);
export const deleteAppointment = (id) =>
	api.delete(`/appointments/${id}`).then(handleResponse).catch(handleError);

export const getProcedureCatalog = () =>
	api.get("/procedures/catalog").then(handleResponse).catch(handleError);
export const getProcedure = (id) =>
	api.get(`/procedures/catalog/${id}`).then(handleResponse).catch(handleError);
export const createProcedure = (procedureData) =>
	api
		.post("/procedures/catalog", procedureData)
		.then(handleResponse)
		.catch(handleError);
export const updateProcedure = (id, procedureData) =>
	api
		.put(`/procedures/catalog/${id}`, procedureData)
		.then(handleResponse)
		.catch(handleError);
export const deleteProcedure = (id) =>
	api
		.delete(`/procedures/catalog/${id}`)
		.then(handleResponse)
		.catch(handleError);

export const getAllergyCatalog = () =>
	api.get("/allergies/catalog").then(handleResponse).catch(handleError);
export const getAllergy = (id) =>
	api.get(`/allergies/catalog/${id}`).then(handleResponse).catch(handleError);
export const createAllergy = (allergyData) =>
	api
		.post("/allergies/catalog", allergyData)
		.then(handleResponse)
		.catch(handleError);
export const updateAllergy = (id, allergyData) =>
	api
		.put(`/allergies/catalog/${id}`, allergyData)
		.then(handleResponse)
		.catch(handleError);
export const deleteAllergy = (id) =>
	api
		.delete(`/allergies/catalog/${id}`)
		.then(handleResponse)
		.catch(handleError);

export const solidLogin = (podProvider) => {
	const encodedPodProvider = encodeURIComponent(podProvider);
	window.location.href = `${api.defaults.baseURL}/solid/login?podProvider=${encodedPodProvider}`;
};

export const getSolidSession = () =>
	api.get("/solid/session").then(handleResponse).catch(handleError);

export const exportSolidUserData = ({
	routeDataset,
	routeShape,
	routeShapeMap,
}) =>
	api
		.post("/solid/exportUserData", {
			routeDataset,
			routeShape,
			routeShapeMap,
		})
		.then(handleResponse)
		.catch(handleError);

export const importSolidUserData = ({
	routeDataset,
	routeShape,
	routeShapeMap,
}) =>
	api
		.post("/solid/importUserData", {
			routeDataset,
			routeShape,
			routeShapeMap,
		})
		.then(handleResponse)
		.catch(handleError);

export const isSolidLoggedIn = () =>
	api.get("/solid/isLoggedIn").then(handleResponse).catch(handleError);

export const logoutFromSolid = () =>
	api.post("/solid/logout").then(handleResponse).catch(handleError);

export const getStats = () =>
	api.get("/stats").then(handleResponse).catch(handleError);
export const getAdminStats = () =>
	api.get("/stats/admin").then(handleResponse).catch(handleError);

export const patientService = {
	getAll: (params = {}) => api.get("/patients", { params }),
	getById: (id) => api.get(`/patients/${id}`),
	create: (patientData) => api.post("/patients", patientData),
	update: (id, patientData) => api.put(`/patients/${id}`, patientData),
	delete: (id) => api.delete(`/patients/${id}`),

	getAllergies: (patientId) => api.get(`/patients/${patientId}/allergies`),
	addAllergy: (patientId, allergyData) =>
		api.post(`/patients/${patientId}/allergies`, allergyData),
	removeAllergy: (patientId, allergyId) =>
		api.delete(`/patients/${patientId}/allergies/${allergyId}`),

	getProcedures: (patientId) => api.get(`/patients/${patientId}/procedures`),
	addProcedure: (patientId, procedureData) =>
		api.post(`/patients/${patientId}/procedures`, procedureData),
	updateProcedure: (patientId, procedureId, procedureData) =>
		api.put(`/patients/${patientId}/procedures/${procedureId}`, procedureData),
	removeProcedure: (patientId, procedureId) =>
		api.delete(`/patients/${patientId}/procedures/${procedureId}`),
	getAppointments: (patientId) =>
		api.get(`/patients/${patientId}/appointments`),
};

export const doctorService = {
	getAll: (params = {}) => api.get("/doctors", { params }),
	getById: (id) => api.get(`/doctors/${id}`),
	create: (doctorData) => api.post("/doctors", doctorData),
	update: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
	delete: (id) => api.delete(`/doctors/${id}`),

	getAppointments: (doctorId, params = {}) =>
		api.get(`/doctors/${doctorId}/appointments`, { params }),
	getAvailableSlots: (doctorId, date) =>
		api.get(`/doctors/${doctorId}/available-slots`, { params: { date } }),
};

export const appointmentService = {
	getAll: (params = {}) => api.get("/appointments", { params }),
	getById: (id) => api.get(`/appointments/${id}`),
	create: (appointmentData) => api.post("/appointments", appointmentData),
	update: (id, appointmentData) =>
		api.put(`/appointments/${id}`, appointmentData),
	delete: (id) => api.delete(`/appointments/${id}`),

	confirm: (id) => api.patch(`/appointments/${id}/confirm`),
	cancel: (id) => api.patch(`/appointments/${id}/cancel`),
	complete: (id) => api.patch(`/appointments/${id}/complete`),
};

export const procedureService = {
	getAll: (params = {}) => api.get("/procedures", { params }),
	getById: (id) => api.get(`/procedures/${id}`),
	create: (procedureData) => api.post("/procedures", procedureData),
	update: (id, procedureData) => api.put(`/procedures/${id}`, procedureData),
	delete: (id) => api.delete(`/procedures/${id}`),
	search: (query) => api.get("/procedures/search", { params: { q: query } }),
};

export const allergyService = {
	getAll: (params = {}) => api.get("/allergies", { params }),
	getById: (id) => api.get(`/allergies/${id}`),
	create: (allergyData) => api.post("/allergies", allergyData),
	update: (id, allergyData) => api.put(`/allergies/${id}`, allergyData),
	delete: (id) => api.delete(`/allergies/${id}`),
	search: (query) => api.get("/allergies/search", { params: { q: query } }),
};

export const userService = {
	getAll: (params = {}) => api.get("/users", { params }),
	getById: (id) => api.get(`/users/${id}`),
	create: (userData) => api.post("/users", userData),
	update: (id, userData) => api.put(`/users/${id}`, userData),
	delete: (id) => api.delete(`/users/${id}`),
	updateProfile: (userData) => api.put("/users/profile", userData),
};

export const solidService = {
	login: (podProvider) => solidLogin(podProvider),
	getSession: () => getSolidSession(),
	exportUserData: (data) => exportSolidUserData(data),
	importUserData: (data) => importSolidUserData(data),
	isLoggedIn: () => isSolidLoggedIn(),
	logout: () => logoutFromSolid(),
};

export const statsService = {
	getDashboard: () => api.get("/stats/dashboard"),
	getPatientStats: () => api.get("/stats/patients"),
	getDoctorStats: () => api.get("/stats/doctors"),
	getAppointmentStats: (params = {}) =>
		api.get("/stats/appointments", { params }),
	getProcedureStats: (params = {}) => api.get("/stats/procedures", { params }),
};
