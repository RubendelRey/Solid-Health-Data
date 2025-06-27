import apiService from "./apiService";

const userService = {
	getAllUsers: async () => {
		try {
			const response = await apiService.get("/users");
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch users" };
		}
	},

	getUserById: async (id) => {
		try {
			const response = await apiService.get(`/users/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch user" };
		}
	},

	createUser: async (userData) => {
		try {
			const response = await apiService.post("/users", userData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to create user" };
		}
	},

	updateUser: async (id, userData) => {
		try {
			const response = await apiService.put(`/users/${id}`, userData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update user" };
		}
	},

	deleteUser: async (id) => {
		try {
			const response = await apiService.delete(`/users/${id}`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete user" };
		}
	},

	getUsersByRole: async (role) => {
		try {
			const response = await apiService.get(`/users/role/${role}`);
			return response.data;
		} catch (error) {
			throw (
				error.response?.data || { message: "Failed to fetch users by role" }
			);
		}
	},

	changeUserPassword: async (id, newPassword) => {
		try {
			const response = await apiService.put(`/users/${id}/password`, {
				newPassword,
			});
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to change password" };
		}
	},

	toggleUserStatus: async (id) => {
		try {
			const response = await apiService.put(`/users/${id}/status`);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to toggle user status" };
		}
	},
};

export default userService;
