export default class Environment {
	static getBackendHost() {
		return process.env.BACKEND_HOST || "localhost";
	}

	static getBackendPort() {
		return process.env.BACKEND_PORT || 1444;
	}

	static getFrontendHost() {
		return process.env.FRONTEND_HOST || "localhost";
	}

	static getFrontendPort() {
		return process.env.FRONTEND_PORT || 1443;
	}

	static getSolidClientId() {
		return process.env.SOLID_CLIENT_ID || "d3p7bqwMATeSxoPZCcMl4";
	}
}
