export default class Environment {
	static getBackendHost() {
		return process.env.BACKEND_HOST || "localhost";
	}

	static getBackendPort() {
		return process.env.BACKEND_PORT || 2444;
	}

	static getFrontendHost() {
		return process.env.FRONTEND_HOST || "localhost";
	}

	static getFrontendPort() {
		return process.env.FRONTEND_PORT || 2443;
	}
}
