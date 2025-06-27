import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";

export const protect = async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1];
	}
	if (!token) {
		return res.status(401).json({
			success: false,
			error: "Not authorized to access this route",
		});
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "dentalclinicsecret"
		);

		req.user = await UserRepository.findById(decoded.id);

		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: "User not found",
			});
		}

		next();
	} catch (err) {
		return res.status(401).json({
			success: false,
			error: "Not authorized to access this route",
		});
	}
};

export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				error: `User role ${req.user.role} is not authorized to access this route`,
			});
		}
		next();
	};
};
