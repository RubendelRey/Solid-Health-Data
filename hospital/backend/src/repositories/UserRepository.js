import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository {
	constructor() {
		super("users");
	}

	async findByEmail(email) {
		try {
			return await this.findOne({ email });
		} catch (error) {
			console.error("Error in findByEmail:", error);
			throw error;
		}
	}

	async findByUsername(username) {
		try {
			return await this.findOne({ username });
		} catch (error) {
			console.error("Error in findByUsername:", error);
			throw error;
		}
	}

	async findByRole(role, options = {}) {
		try {
			return await this.findAll({ role }, options);
		} catch (error) {
			console.error("Error in findByRole:", error);
			throw error;
		}
	}

	async login(email, password) {
		try {
			const user = await this.findOne({ email });

			if (!user) {
				return null;
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return null;
			}

			await this.updateLastLogin(user._id);

			const { password: _, ...userWithoutPassword } = user;
			return userWithoutPassword;
		} catch (error) {
			console.error("Error in login:", error);
			throw error;
		}
	}

	async findActiveUsers(options = {}) {
		try {
			return await this.findAll({ isActive: true }, options);
		} catch (error) {
			console.error("Error in findActiveUsers:", error);
			throw error;
		}
	}

	async updateLastLogin(userId) {
		try {
			return await this.update(userId, {
				lastLogin: new Date(),
			});
		} catch (error) {
			console.error("Error in updateLastLogin:", error);
			throw error;
		}
	}

	async createUser(userData) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(userData.password, salt);

			const userWithHashedPassword = {
				...userData,
				password: hashedPassword,
				isActive: true,
			};

			return await this.create(userWithHashedPassword);
		} catch (error) {
			console.error("Error in createUser:", error);
			throw error;
		}
	}

	async updatePassword(userId, newPassword) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);

			return await this.update(userId, {
				password: hashedPassword,
			});
		} catch (error) {
			console.error("Error in updatePassword:", error);
			throw error;
		}
	}

	getSignedJwtToken(user) {
		return jwt.sign(
			{ id: user._id, role: user.role },
			process.env.JWT_SECRET || "hospitalsecret",
			{ expiresIn: process.env.JWT_EXPIRE || "30d" }
		);
	}

	async deactivateUser(userId) {
		try {
			return await this.update(userId, { isActive: false });
		} catch (error) {
			console.error("Error in deactivateUser:", error);
			throw error;
		}
	}

	async activateUser(userId) {
		try {
			return await this.update(userId, { isActive: true });
		} catch (error) {
			console.error("Error in activateUser:", error);
			throw error;
		}
	}
}

export default new UserRepository();
