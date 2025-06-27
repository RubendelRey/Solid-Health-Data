import api from "./authService";

const handleResponse = (response) => response.data;
const handleError = (error) => {
	console.error("Load Testing API Error:", error);
	throw error;
};

export const exportAllPatientsToSolid = (loadTestConfig) =>
	api
		.post("/bulk-export/exportAllToSolid", {
			testsConfiguration: loadTestConfig.testsConfiguration,
			pathConfiguration: loadTestConfig.pathConfiguration,
		})
		.then(handleResponse)
		.catch(handleError);

export const getLoadTestInfo = () =>
	api
		.get("/bulk-export/info")
		.then(() => ({
			available: true,
		}))
		.catch(handleError);

export default {
	getLoadTestInfo,
	exportAllPatientsToSolid,
};
