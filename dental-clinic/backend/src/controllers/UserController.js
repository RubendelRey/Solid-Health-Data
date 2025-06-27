import UserService from "../services/UserService.js";

class UserController {
	async getUsers(req, res) {
		try {
			const users = await UserService.getAllUsers();
			res.status(200).json(users);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getUser(req, res) {
		try {
			const user = await UserService.getUserById(req.params.id);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async createUser(req, res) {
		try {
			const { name, surname, email, password, role } = req.body;

			if (!name || !surname || !email || !password) {
				return res.status(400).json({
					error: "Please provide name, surname, email, and password",
				});
			}

			if (role === "patient") {
				const { patientData } = req.body;

				if (!patientData) {
					return res.status(400).json({
						error: "Patient data is required for patient registration",
					});
				}

				const requiredFields = ["nif", "dateOfBirth", "gender", "phoneNumbers"];
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

				const requiredFields = [
					"specialization",
					"collegiateNumber",
					"license",
				];
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

			const userData = await UserService.createUser(req.body);
			res.status(201).json(userData);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateUser(req, res) {
		try {
			const user = await UserService.updateUser(req.params.id, req.body);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.status(200).json(user);
		} catch (error) {
			console.error("Error updating user:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async deleteUser(req, res) {
		try {
			const result = await UserService.deleteUser(req.params.id);
			if (!result) {
				return res.status(404).json({ error: "User not found" });
			}
			res.status(200).json({ message: "User deleted successfully" });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getUsersByRole(req, res) {
		try {
			const users = await UserService.getUsersByRole(req.params.role);
			res.status(200).json(users);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async changeUserPassword(req, res) {
		try {
			const { newPassword } = req.body;

			if (!newPassword) {
				return res.status(400).json({
					error: "Please provide new password",
				});
			}

			const result = await UserService.changePassword(
				req.params.id,
				newPassword
			);
			if (!result) {
				return res.status(404).json({ error: "User not found" });
			}

			res.status(200).json({ message: "Password updated successfully" });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async toggleUserStatus(req, res) {
		try {
			const result = await UserService.toggleUserStatus(req.params.id);
			if (!result) {
				return res.status(404).json({ error: "User not found" });
			}

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

export default new UserController();
