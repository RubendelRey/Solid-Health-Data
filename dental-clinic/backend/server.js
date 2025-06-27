import bp from "body-parser";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import expressSession from "express-session";
import { readFileSync } from "fs";
import { createServer } from "https";
import connectDB from "./src/config/db.js";

import allergyRoutes from "./src/routes/allergies.js";
import authRoutes from "./src/routes/auth.js";
import bulkExportRoutes from "./src/routes/bulkExport.js";
import doctorRoutes from "./src/routes/doctors.js";
import interventionRoutes from "./src/routes/interventions.js";
import interventionTypeRoutes from "./src/routes/interventionTypes.js";
import loadTestResultRoutes from "./src/routes/loadTestResults.js";
import patientRoutes from "./src/routes/patients.js";
import solidRoutes from "./src/routes/solid.js";
import userRoutes from "./src/routes/users.js";

dotenv.config();

connectDB();

const app = express();
const port = parseInt(process.env.PORT || "1444");
const secret = process.env.SESSION_SECRET || "dentalclinicsecret";

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(
	expressSession({
		secret: secret,
		resave: true,
		saveUninitialized: true,
	})
);

app.set("password", secret);
app.set("crypto", crypto);

const api = express.Router();
app.use("/api", api);

api.use("/auth", authRoutes);
api.use("/users", userRoutes);
api.use("/patients", patientRoutes);
api.use("/doctors", doctorRoutes);
api.use("/interventions", interventionRoutes);
api.use("/allergies", allergyRoutes);
api.use("/intervention-types", interventionTypeRoutes);
api.use("/solid", solidRoutes);
api.use("/bulk-export", bulkExportRoutes);
api.use("/load-test-results", loadTestResultRoutes);

api.get("/", (req, res) => {
	res.status(200).json({
		message: "Dental Clinic API is running",
	});
});

app.use((err, req, res, next) => {
	console.error(err.stack);

	res.status(500).json({
		success: false,
		error: "Server Error",
	});
});

let privateKey = readFileSync("certificates/privkey.pem");
let certificate = readFileSync("certificates/fullchain.pem");
let credentials = { key: privateKey, cert: certificate };

createServer(credentials, app)
	.listen(port, () => {
		console.log(`🦷 Dental Clinic API server running on port ${port} 🦷`);
	})
	.on("error", (error) => {
		console.error("Error occurred: " + error.message);
	});

process.on("unhandledRejection", (err, promise) => {
	console.error(`⛔ Error: ${err.message} ⛔`);
});
