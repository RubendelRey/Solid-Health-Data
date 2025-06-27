import apiService, { baseURL } from "./apiService";

class SolidService {
	async login(podProvider) {
		try {
			let encodedPodProvider = encodeURIComponent(podProvider);
			window.location.href = `${baseURL}/solid/login?podProvider=${encodedPodProvider}`;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to login to Solid pod"
			);
		}
	}

	async getSession() {
		try {
			const response = await apiService.get("/solid/session");
			return response.data;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to get session info"
			);
		}
	}

	async exportUserData({ routeDataset, routeShape, routeShapeMap }) {
		try {
			const response = await apiService.post("/solid/exportUserData", {
				routeDataset,
				routeShape,
				routeShapeMap,
			});
			if (response.status !== 200) {
				throw new Error("Failed to export data to Solid pod");
			}

			return response;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to export data to Solid pod"
			);
		}
	}

	async importUserData({ routeDataset, routeShape, routeShapeMap }) {
		try {
			const response = await apiService.post("/solid/importUserData", {
				routeDataset,
				routeShape,
				routeShapeMap,
			});
			return response.data;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to import data from Solid pod"
			);
		}
	}

	async isLoggedIn() {
		try {
			const response = await apiService.get("/solid/isLoggedIn");
			return response.data;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to check login status"
			);
		}
	}

	async logout() {
		try {
			const response = await apiService.post("/solid/logout");
			return response.data;
		} catch (error) {
			throw new Error(
				error.response?.data?.error || "Failed to logout from Solid pod"
			);
		}
	}
}

export default new SolidService();
