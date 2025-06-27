import {
	getSessionFromStorage,
	Session,
} from "@inrupt/solid-client-authn-node";
import express from "express";
import { authenticateToken, requirePatient } from "../middleware/auth.js";
import SolidService from "../services/SolidService.js";
import Environment from "../utils/Environment.js";
import SessionUtils from "../utils/SessionUtils.js";

const router = express.Router();

router.get("/login", async (req, res) => {
	try {
		let podProvider = decodeURIComponent(req.query.podProvider);
		if (!podProvider) {
			return res.status(400).json({ error: "Pod provider is required" });
		}
		const session = new Session();
		req.session.solidSessionId = session.info.sessionId;
		await session.login({
			oidcIssuer: podProvider,
			redirectUrl: `https://${Environment.getBackendHost()}:${Environment.getBackendPort()}/api/solid/login/success`,
			clientName: "hospital",
			handleRedirect: (url) => {
				res.redirect(url);
			},
		});
	} catch (error) {
		console.error("SOLID login error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/login/success", async (req, res) => {
	try {
		let sessionId = req.session.solidSessionId;
		let solidSession = await getSessionFromStorage(sessionId);

		let redirectUrl = `https://${Environment.getBackendHost()}:${Environment.getBackendPort()}/api/solid${
			req.url
		}`;

		await solidSession.handleIncomingRedirect(redirectUrl.toString());
		res.redirect(
			`https://${Environment.getFrontendHost()}:${Environment.getFrontendPort()}/patient/data-export`
		);
	} catch (error) {
		console.error("SOLID login success error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/isLoggedIn", authenticateToken, async (req, res) => {
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
});

router.post(
	"/exportUserData",
	authenticateToken,
	requirePatient,
	async (req, res) => {
		try {
			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(400).json({ error: "User is not logged in" });
			}

			await SolidService.exportUserData(
				sessionId,
				req.user.patient,
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
);

router.post(
	"/importUserData",
	authenticateToken,
	requirePatient,
	async (req, res) => {
		try {
			let sessionId = SessionUtils.getSolidSessionId(req);
			if (!sessionId) {
				return res.status(400).json({ error: "User is not logged in" });
			}
			await SolidService.importUserData(
				sessionId,
				req.user.patient,
				req.body.routeDataset,
				req.body.routeShape,
				req.body.routeShapeMap
			);
			res.status(200).json({ message: "User data imported successfully" });
		} catch (error) {
			console.error("Error importing user data:", error);
			res.status(400).json({ error: error.message });
		}
	}
);

router.post("/logout", authenticateToken, async (req, res) => {
	try {
		res.json({
			message: "SOLID logout successful",
		});
	} catch (error) {
		console.error("SOLID logout error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

export default router;
