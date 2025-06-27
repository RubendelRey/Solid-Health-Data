import bcrypt from "bcryptjs";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class UserController {
	async getAll(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can view all users",
				});
			}

			const { page = 1, limit = 10, search = "", role, active } = req.query;
			const skip = (page - 1) * limit;

			let query = {};
			if (search) {
				query.$or = [
					{ email: { $regex: search, $options: "i" } },
					{ "profile.firstName": { $regex: search, $options: "i" } },
					{ "profile.lastName": { $regex: search, $options: "i" } },
				];
			}
			if (role) {
				query.role = role;
			}
			if (active !== undefined) {
				query.isActive = active === "true";
			}
			const options = {
				sort: { createdAt: -1 },
				limit: parseInt(limit),
				skip,
			};

			const users = await UserRepository.findAll(query, options);
			const totalCount = await UserRepository.count(query);

			res.json({
				success: true,
				data: users,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get users error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving users",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;

			if (req.user.role !== "administrator" && req.userId !== id) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}
			const user = await UserRepository.findById(id);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			const { password, ...userWithoutPassword } = user;

			res.json({ success: true, data: userWithoutPassword });
		} catch (error) {
			console.error("Get user by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving user",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can create users",
				});
			}

			const { email, password, role, profile, ...roleSpecificData } = req.body;

			if (!email || !password || !role) {
				return res.status(400).json({
					success: false,
					message: "Email, password, and role are required",
				});
			}

			const allowedRoles = ["administrator", "doctor", "patient"];
			if (!allowedRoles.includes(role)) {
				return res.status(400).json({
					success: false,
					message: "Invalid role specified",
				});
			}
			const existingUser = await UserRepository.findByEmail(email);
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "User with this email already exists",
				});
			}

			const userData = {
				email,
				password,
				role,
				profile: {
					firstName: profile?.firstName || "",
					lastName: profile?.lastName || "",
				},
			};

			const savedUser = await UserRepository.createUser(userData);

			let roleProfile = null;

			if (role === "patient") {
				roleProfile = {
					user: savedUser._id,
					name: [
						{
							use: "official",
							family: profile?.lastName || "",
							given: [profile?.firstName || ""],
						},
					],
					...roleSpecificData,
				};
				await PatientRepository.update(savedUser._id, roleProfile);
				savedUser.patient = roleProfile._id;
			} else if (role === "doctor") {
				roleProfile = {
					user: savedUser._id,
					name: [
						{
							use: "official",
							family: profile?.lastName || "",
							given: [profile?.firstName || ""],
						},
					],
					...roleSpecificData,
				};
				await DoctorRepository.update(savedUser._id, roleProfile);
				savedUser.doctor = roleProfile._id;
			}

			await UserRepository.update(savedUser._id, savedUser);

			const populatedUser = await UserRepository.findById(savedUser._id);

			res.status(201).json({
				success: true,
				message: "User created successfully",
				data: populatedUser,
			});
		} catch (error) {
			console.error("Create user error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating user",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			const { id } = req.params;
			const updateData = req.body;

			if (req.user.role !== "administrator" && req.userId !== id) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}

			delete updateData.password;
			delete updateData.role;
			delete updateData._id;
			const user = await UserRepository.update(id, updateData);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			const { password, ...userWithoutPassword } = user;
			res.json({
				success: true,
				message: "User updated successfully",
				data: userWithoutPassword,
			});
		} catch (error) {
			console.error("Update user error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating user",
				error: error.message,
			});
		}
	}

	async changePassword(req, res) {
		try {
			const { id } = req.params;
			const { currentPassword, newPassword } = req.body;

			if (req.user.role !== "administrator" && req.userId !== id) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}

			if (!newPassword || newPassword.length < 6) {
				return res.status(400).json({
					success: false,
					message: "New password must be at least 6 characters long",
				});
			}
			const user = await UserRepository.findById(id);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			if (req.user.role !== "administrator") {
				if (!currentPassword) {
					return res.status(400).json({
						success: false,
						message: "Current password is required",
					});
				}

				const isCurrentPasswordValid = await bcrypt.compare(
					currentPassword,
					user.password
				);
				if (!isCurrentPasswordValid) {
					return res.status(400).json({
						success: false,
						message: "Current password is incorrect",
					});
				}
			}
			await UserRepository.updatePassword(id, newPassword);

			res.json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error) {
			console.error("Change password error:", error);
			res.status(500).json({
				success: false,
				message: "Error changing password",
				error: error.message,
			});
		}
	}

	async updateRole(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can change user roles",
				});
			}

			const { id } = req.params;
			const { role } = req.body;

			const allowedRoles = ["administrator", "doctor", "patient"];
			if (!allowedRoles.includes(role)) {
				return res.status(400).json({
					success: false,
					message: "Invalid role specified",
				});
			}

			const user = await UserRepository.findById(id);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			if (user.role !== role) {
				if (user.role === "patient" && user.patient) {
					await PatientRepository.delete(user.patient);
					user.patient = undefined;
				} else if (user.role === "doctor" && user.doctor) {
					await DoctorRepository.delete(user.doctor);
					user.doctor = undefined;
				}

				if (role === "patient") {
					const patient = {
						user: user._id,
						name: [
							{
								use: "official",
								family: user.profile?.lastName || "",
								given: [user.profile?.firstName || ""],
							},
						],
					};
					await PatientRepository.update(user.patient, patient);
					user.patient = patient._id;
				} else if (role === "doctor") {
					const doctor = {
						user: user._id,
						name: [
							{
								use: "official",
								family: user.profile?.lastName || "",
								given: [user.profile?.firstName || ""],
							},
						],
					};
					await DoctorRepository.update(user.doctor, doctor);
					user.doctor = doctor._id;
				}

				user.role = role;
				await UserRepository.update(id, user);
			}

			const updatedUser = await UserRepository.findById(id);

			res.json({
				success: true,
				message: "User role updated successfully",
				data: updatedUser,
			});
		} catch (error) {
			console.error("Update user role error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating user role",
				error: error.message,
			});
		}
	}

	async toggleActive(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can activate/deactivate users",
				});
			}

			const { id } = req.params;
			const { isActive } = req.body;

			const user = await UserRepository.update(
				id,
				{ isActive },
				{ new: true }
			).select("-password");

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			res.json({
				success: true,
				message: `User ${isActive ? "activated" : "deactivated"} successfully`,
				data: user,
			});
		} catch (error) {
			console.error("Toggle user active error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating user status",
				error: error.message,
			});
		}
	}

	async delete(req, res) {
		try {
			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can delete users",
				});
			}

			const { id } = req.params;

			const user = await UserRepository.findById(id);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			if (user.role === "patient" && user.patient) {
				await PatientRepository.delete(user.patient);
			} else if (user.role === "doctor" && user.doctor) {
				await DoctorRepository.delete(user.doctor);
			}

			await UserRepository.delete(id);

			res.json({
				success: true,
				message: "User deleted successfully",
			});
		} catch (error) {
			console.error("Delete user error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting user",
				error: error.message,
			});
		}
	}

	async getProfile(req, res) {
		try {
			const user = await UserRepository.findById(req.userId);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			res.json({
				success: true,
				data: user,
			});
		} catch (error) {
			console.error("Get profile error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving profile",
				error: error.message,
			});
		}
	}

	async updateProfile(req, res) {
		try {
			const updateData = req.body;

			delete updateData.password;
			delete updateData.role;
			delete updateData._id;

			const user = await UserRepository.update(req.userId, updateData, {
				new: true,
				runValidators: true,
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: user,
			});
		} catch (error) {
			console.error("Update profile error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating profile",
				error: error.message,
			});
		}
	}
}

export default new UserController();
