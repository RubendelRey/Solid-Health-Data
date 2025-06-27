import { getSessionFromStorage } from "@inrupt/solid-client-authn-node";
import SolidService from "../services/SolidService.js";
import SessionUtils from "../utils/SessionUtils.js";

class SolidController {
	async login(req, res) {
		try {
			let podProvider = decodeURIComponent(req.query.podProvider);
			if (!podProvider) {
				return res.status(400).json({ error: "Pod provider is required" });
			}

			await SolidService.login(podProvider, req, res);
		} catch (error) {
			console.error("Error during Solid login:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async successfulLogin(req, res) {
		try {
			await SolidService.successfulLogin(req, res);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getSession(req, res) {
		try {
			const sessionId = req.session.solidSessionId;
			if (!sessionId) {
				return res.status(200).json({ isLoggedIn: false });
			}

			const sessionInfo = await SolidService.getSessionInfo(sessionId);
			res.status(200).json({
				isLoggedIn: sessionInfo.isLoggedIn,
				webId: sessionInfo.webId,
				provider: sessionInfo.provider,
			});
		} catch (error) {
			console.error("Error getting session info:", error);
			res.status(200).json({ isLoggedIn: false });
		}
	}

	async getProfile(req, res) {
		try {
			const profile = await SolidService.getProfile(req.user);
			res.status(200).json(profile);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async exportUserData(req, res) {
		try {
			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(400).json({ error: "User is not logged in" });
			}

			await SolidService.exportUserData(
				sessionId,
				req.user.patientId,
				req.body.routeDataset,
				req.body.routeShape,
				req.body.routeShapeMap
			);
			res.status(200).json({ message: "User data exported successfully" });
		} catch (error) {
			console.error("Error exporting user data:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async importUserData(req, res) {
		try {
			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(400).json({ error: "User is not logged in" });
			}
			let result = await SolidService.importUserData(
				sessionId,
				req.user.patientId,
				req.body.routeDataset,
				req.body.routeShape,
				req.body.routeShapeMap
			);
			res.status(200).json(result);
		} catch (error) {
			console.error("Error importing user data:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async isLoggedIn(req, res) {
		try {
			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(200).json({ isLoggedIn: false });
			}

			const session = await getSessionFromStorage(sessionId);
			const isLoggedIn = session && session.info.isLoggedIn;
			res.status(200).json({ isLoggedIn });
		} catch (error) {
			console.error("Error checking login status:", error);
			res.status(400).json({ error: error.message });
		}
	}
}

export default new SolidController();
