import express from "express";
import BulkExportController from "../controllers/BulkExportController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.post("/exportAllToSolid", BulkExportController.exportAllToSolid);

export default router;
