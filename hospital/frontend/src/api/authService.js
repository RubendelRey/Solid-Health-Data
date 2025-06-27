import axios from "axios";

const API_HOST = import.meta.env.API_HOST || "localhost";
const API_PORT = import.meta.env.API_PORT || "2444";
const API_BASE_PATH = import.meta.env.API_BASE_PATH || "/api";

const api = axios.create({
	baseURL: `https://${API_HOST}:${API_PORT}${API_BASE_PATH}`,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export const authService = {
	login: (credentials) => api.post("/auth/login", credentials),
	register: (userData) => api.post("/auth/register", userData),
	getCurrentUser: () => api.get("/auth/me"),
	changePassword: (passwords) => api.put("/auth/change-password", passwords),
	resetPassword: (email) => api.post("/auth/reset-password", { email }),
	confirmResetPassword: (token, password) =>
		api.post("/auth/confirm-reset-password", { token, password }),
};

export default api;
