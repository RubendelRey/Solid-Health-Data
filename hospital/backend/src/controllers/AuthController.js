import bcrypt from "bcryptjs";
import UserRepository from "../repositories/UserRepository.js";

class AuthController {
	async login(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return res.status(400).json({
					success: false,
					message: "Email and password are required",
				});
			}

			const user = await UserRepository.login(email, password);
			if (!user) {
				return res.status(401).json({
					success: false,
					message: "Invalid credentials",
				});
			}

			if (!user.isActive) {
				return res.status(401).json({
					success: false,
					message: "Account is deactivated. Please contact administrator.",
				});
			}

			const token = UserRepository.getSignedJwtToken(user);

			const userResponse = {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
				lastLogin: user.lastLogin,
			};

			res.json({
				success: true,
				message: "Login successful",
				user: userResponse,
				token,
			});
		} catch (error) {
			console.error("Login error:", error);
			res.status(500).json({
				success: false,
				message: "Server error during login",
			});
		}
	}
	async register(req, res) {
		try {
			const { name, email, password, role } = req.body;

			if (!name || !email || !password || !role) {
				return res.status(400).json({
					success: false,
					message: "All fields are required",
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
				return res.status(409).json({
					success: false,
					message: "User with this email already exists",
				});
			}

			const userData = {
				name,
				email,
				password,
				role,
			};

			const savedUser = await UserRepository.createUser(userData);

			const userResponse = {
				id: savedUser._id,
				name: savedUser.name,
				email: savedUser.email,
				role: savedUser.role,
				isActive: savedUser.isActive,
				createdAt: savedUser.createdAt,
			};

			res.status(201).json({
				success: true,
				message: "User created successfully",
				user: userResponse,
			});
		} catch (error) {
			console.error("Registration error:", error);
			res.status(500).json({
				success: false,
				message: "Server error during registration",
			});
		}
	}
	async me(req, res) {
		try {
			const user = await UserRepository.findById(req.user.userId);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			const { password, ...userWithoutPassword } = user;

			res.json({
				success: true,
				user: userWithoutPassword,
			});
		} catch (error) {
			console.error("Get current user error:", error);
			res.status(500).json({
				success: false,
				message: "Server error",
			});
		}
	}
	async changePassword(req, res) {
		try {
			const { currentPassword, newPassword } = req.body;

			if (!currentPassword || !newPassword) {
				return res.status(400).json({
					success: false,
					message: "Current password and new password are required",
				});
			}

			const user = await UserRepository.findById(req.user.userId);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}

			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) {
				return res.status(401).json({
					success: false,
					message: "Current password is incorrect",
				});
			}

			await UserRepository.updatePassword(req.user.userId, newPassword);

			res.json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error) {
			console.error("Change password error:", error);
			res.status(500).json({
				success: false,
				message: "Server error during password change",
			});
		}
	}
	async resetPassword(req, res) {
		try {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({
					success: false,
					message: "Email is required",
				});
			}

			const user = await UserRepository.findByEmail(email);
			if (!user) {
				return res.json({
					success: true,
					message:
						"If an account with that email exists, a password reset link has been sent.",
				});
			}

			res.json({
				success: true,
				message:
					"If an account with that email exists, a password reset link has been sent.",
			});
		} catch (error) {
			console.error("Reset password error:", error);
			res.status(500).json({
				success: false,
				message: "Server error during password reset",
			});
		}
	}

	async logout(req, res) {
		try {
			res.json({
				success: true,
				message: "Logged out successfully",
			});
		} catch (error) {
			console.error("Logout error:", error);
			res.status(500).json({
				success: false,
				message: "Server error during logout",
			});
		}
	}
}

export default new AuthController();
