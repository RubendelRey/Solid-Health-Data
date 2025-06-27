import express from "express";
import AuthController from "../controllers/AuthController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", protect, authorize("admin"), AuthController.register);
router.post("/login", AuthController.login);

router.get("/me", protect, AuthController.getMe);

export default router;
