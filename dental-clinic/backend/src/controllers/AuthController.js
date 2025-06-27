import jwt from "jsonwebtoken";
import AuthService from "../services/AuthService.js";

class AuthController {
	async getUsers(req, res) {
		try {
			const users = await AuthService.getAllUsers();
			res.status(200).json(users);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getUser(req, res) {
		try {
			const user = await AuthService.getUserById(req.params.id);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async deleteUser(req, res) {
		try {
			const user = await AuthService.deleteUser(req.params.id);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.status(200).json({ message: "User deleted successfully" });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async register(req, res) {
		try {
			const { name, email, password, role } = req.body;

			if (!name || !email || !password) {
				return res.status(400).json({
					error: "Please provide name, email, and password",
				});
			}

			if (role === "patient") {
				const { patientData } = req.body;

				if (!patientData) {
					return res.status(400).json({
						error: "Patient data is required for patient registration",
					});
				}

				const requiredFields = [
					"name",
					"surname",
					"nif",
					"dateOfBirth",
					"gender",
					"phoneNumbers",
				];
				const missingFields = requiredFields.filter(
					(field) => !patientData[field]
				);

				if (missingFields.length > 0) {
					return res.status(400).json({
						error: `Missing required patient fields: ${missingFields.join(
							", "
						)}`,
					});
				}
			} else if (role === "doctor") {
				const { doctorData } = req.body;

				if (!doctorData) {
					return res.status(400).json({
						error: "Doctor data is required for doctor registration",
					});
				}

				const requiredFields = ["specialization", "collegiateNumber"];
				const missingFields = requiredFields.filter(
					(field) => !doctorData[field]
				);

				if (missingFields.length > 0) {
					return res.status(400).json({
						error: `Missing required doctor fields: ${missingFields.join(
							", "
						)}`,
					});
				}
			}

			const userData = await AuthService.register(req.body);
			res.status(201).json(userData);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async login(req, res) {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({
				error: "Please provide email and password",
			});
		}

		try {
			const userData = await AuthService.login(email, password);
			res.status(200).json(userData);
		} catch (error) {
			console.error("Login error:", error);
			res.status(401).json({ error: error.message });
		}
	}

	async getMe(req, res) {
		try {
			const token = req.headers.authorization?.split(" ")[1];

			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET || "dentalclinicsecret"
			);

			const userData = await AuthService.getMe(decoded.id);
			res.status(200).json(userData);
		} catch (err) {
			res.status(401).json({
				error: "Invalid token or token not provided",
			});
		}
	}
}

export default new AuthController();
