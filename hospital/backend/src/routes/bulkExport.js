import express from "express";
import BulkExportController from "../controllers/BulkExportController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.post("/exportAllToSolid", BulkExportController.exportAllToSolid);

export default router;
