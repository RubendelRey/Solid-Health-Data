import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

const userRepository = UserRepository;
const patientRepository = PatientRepository;
const doctorRepository = DoctorRepository;

router.post("/register", async (req, res) => {
	try {
		const { email, password, role, firstName, lastName, ...roleSpecificData } =
			req.body;

		const existingUser = await userRepository.findByEmail(email);
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "User already exists with this email" });
		}

		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const userData = {
			email,
			password: hashedPassword,
			role,
			profile: {
				firstName,
				lastName,
			},
		};

		const user = await userRepository.create(userData);

		let roleProfile = null;

		if (role === "patient") {
			const patientData = {
				user: user._id,
				name: [
					{
						use: "official",
						family: lastName,
						given: [firstName],
					},
				],
				...roleSpecificData,
			};
			roleProfile = await patientRepository.create(patientData);
			await userRepository.update(user._id, { patient: roleProfile._id });
		} else if (role === "doctor") {
			const doctorData = {
				user: user._id,
				name: [
					{
						use: "official",
						family: lastName,
						given: [firstName],
					},
				],
				...roleSpecificData,
			};
			roleProfile = await doctorRepository.create(doctorData);
			await userRepository.update(user._id, { doctor: roleProfile._id });
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.status(201).json({
			message: "User registered successfully",
			token,
			user: {
				id: user._id,
				email: user.email,
				role: user.role,
				profile: user.profile,
				patient:
					roleProfile && role === "patient" ? roleProfile._id : undefined,
				doctor: roleProfile && role === "doctor" ? roleProfile._id : undefined,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			message: "Server error during registration",
			error: error.message,
		});
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await userRepository.findByEmail(email);

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isValidPassword = password === user.password;
		if (!isValidPassword) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		let patientData = null;
		let doctorData = null;

		if (user.patient) {
			patientData = await patientRepository.findById(user.patient);
		}
		if (user.doctor) {
			doctorData = await doctorRepository.findById(user.doctor);
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		await userRepository.update(user._id, { lastLogin: new Date() });

		res.json({
			message: "Login successful",
			token,
			user: {
				id: user._id,
				email: user.email,
				role: user.role,
				profile: user.profile,
				patient: patientData,
				doctor: doctorData,
				lastLogin: new Date(),
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res
			.status(500)
			.json({ message: "Server error during login", error: error.message });
	}
});

router.get("/me", authenticateToken, async (req, res) => {
	try {
		const user = await userRepository.findById(req.userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		let patientData = null;
		let doctorData = null;

		if (user.patient) {
			patientData = await patientRepository.findById(user.patient);
		}
		if (user.doctor) {
			doctorData = await doctorRepository.findById(user.doctor);
		}

		const { password, ...userWithoutPassword } = user;

		res.json({
			...userWithoutPassword,
			patient: patientData,
			doctor: doctorData,
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.post("/change-password", authenticateToken, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		const user = await userRepository.findById(req.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const isValidPassword = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isValidPassword) {
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		await userRepository.update(req.userId, { password: hashedPassword });

		res.json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.post("/logout", authenticateToken, (req, res) => {
	res.json({ message: "Logout successful" });
});

router.post("/refresh", authenticateToken, async (req, res) => {
	try {
		const user = await userRepository.findById(req.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.json({ token });
	} catch (error) {
		console.error("Token refresh error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

export default router;
