import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";

export const authenticateToken = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "Access token required" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await UserRepository.findById(decoded.userId);

		if (!user) {
			console.error("User not found for ID:", decoded.userId);
			return res.status(401).json({ message: "User not found" });
		}

		const { password, ...userWithoutPassword } = user;
		req.user = userWithoutPassword;
		req.userId = decoded.userId;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ message: "Token expired" });
		}
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({ message: "Invalid token" });
		}
		return res
			.status(500)
			.json({ message: "Server error during authentication" });
	}
};

export const authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				message: `Access denied. Required roles: ${roles.join(
					", "
				)}. Your role: ${req.user.role}`,
			});
		}

		next();
	};
};

export const requireAdmin = authorizeRoles("administrator");

export const requireDoctorOrAdmin = authorizeRoles("doctor", "administrator");

export const requirePatientOrAdmin = authorizeRoles("patient", "administrator");

export const requirePatient = authorizeRoles("patient");

export const canAccessPatientData = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const patientId = req.params.patientId || req.params.id;

		if (req.user.role === "administrator") {
			return next();
		}
		if (
			req.user.role === "patient" &&
			req.user.patient &&
			req.user.patient.toString() === patientId
		) {
			return next();
		}

		if (req.user.role === "doctor") {
			return next();
		}

		return res.status(403).json({ message: "Access denied to patient data" });
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Server error during authorization check" });
	}
};

export const canAccessDoctorData = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const doctorId = req.params.doctorId || req.params.id;

		if (req.user.role === "administrator") {
			return next();
		}
		if (
			req.user.role === "doctor" &&
			req.user.doctor &&
			req.user.doctor.toString() === doctorId
		) {
			return next();
		}

		if (req.user.role === "patient" && req.method === "GET") {
			return next();
		}

		return res.status(403).json({ message: "Access denied to doctor data" });
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Server error during authorization check" });
	}
};

export const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			return next();
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await UserRepository.findById(decoded.id);

		if (user) {
			const { password, ...userWithoutPassword } = user;
			req.user = userWithoutPassword;
			req.userId = decoded.id;
		}

		next();
	} catch (error) {
		next();
	}
};

// Alias for authenticateToken to match dental-clinic naming convention
export const protect = authenticateToken;

// Authorization middleware factory function
export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: "Not authorized to access this route",
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				error: `User role ${req.user.role} is not authorized to access this route`,
			});
		}
		next();
	};
};
