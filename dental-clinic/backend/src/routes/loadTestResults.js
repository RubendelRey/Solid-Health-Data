import express from "express";
import LoadTestResultController from "../controllers/LoadTestResultController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
	.route("/")
	.get(authorize("admin"), LoadTestResultController.getAllResults);

router
	.route("/stats")
	.get(authorize("admin"), LoadTestResultController.getAggregatedStats);

router
	.route("/export")
	.get(authorize("admin"), LoadTestResultController.exportToCsv);

export default router;
