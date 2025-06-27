import axios from "axios";

const API_HOST = import.meta.env.API_HOST || "localhost";
const API_PORT = import.meta.env.API_PORT || "1444";
const API_BASE_PATH = import.meta.env.API_BASE_PATH || "/api";

export const baseURL = `https://${API_HOST}:${API_PORT}${API_BASE_PATH}`;

const apiService = axios.create({
	baseURL,
	headers: {
		"Content-Type": "application/json",
	},
});

apiService.interceptors.request.use(
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

apiService.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export default apiService;
