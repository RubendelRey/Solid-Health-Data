import apiService from "./apiService";

const handleResponse = (response) => response.data;
const handleError = (error) => {
	console.error("Load Test Results API Error:", error);
	throw error;
};

export const getAllResults = (params = {}) => {
	const queryParams = new URLSearchParams(params);
	return apiService
		.get(`/load-test-results?${queryParams}`)
		.then(handleResponse)
		.catch(handleError);
};

export const getStats = (filters = {}) => {
	const queryParams = new URLSearchParams(filters);
	return apiService
		.get(`/load-test-results/stats?${queryParams}`)
		.then(handleResponse)
		.catch(handleError);
};

export const exportToCsv = (filters = {}) => {
	const queryParams = new URLSearchParams(filters);
	return apiService
		.get(`/load-test-results/export?${queryParams}`, {
			responseType: "blob",
		})
		.then((response) => response.data)
		.catch(handleError);
};

export default {
	getAllResults,
	getStats,
	exportToCsv,
};
