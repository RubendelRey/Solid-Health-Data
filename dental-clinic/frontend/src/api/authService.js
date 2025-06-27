import { jwtDecode } from "jwt-decode";
import apiService from "./apiService";

const authService = {
	login: async (email, password) => {
		try {
			const response = await apiService.post("/auth/login", {
				email,
				password,
			});
			const user = response.data;

			localStorage.setItem("user", JSON.stringify(user));
			localStorage.setItem("token", user.token);
			return user;
		} catch (error) {
			throw error.response?.data || { message: "Login failed" };
		}
	},

	register: async (userData) => {
		try {
			const response = await apiService.post("/auth/register", userData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Registration failed" };
		}
	},

	logout: () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	},

	isAuthenticated: () => {
		const token = localStorage.getItem("token");
		if (!token) return false;

		try {
			const decoded = jwtDecode(token);
			const currentTime = Date.now() / 1000;
			return decoded.exp > currentTime;
		} catch (error) {
			return false;
		}
	},

	getCurrentUser: () => {
		try {
			const user = localStorage.getItem("user");
			return user ? JSON.parse(user) : null;
		} catch (error) {
			return null;
		}
	},

	getUserRole: () => {
		const user = authService.getCurrentUser();
		return user ? user.role : null;
	},
};

export default authService;
