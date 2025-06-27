import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
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

	async findByRole(role, options = {}) {
		try {
			return await this.findAll({ role }, options);
		} catch (error) {
			console.error("Error in findByRole:", error);
			throw error;
		}
	}

	async findByPatient(patientId) {
		try {
			return await this.findOne({ patientId: new ObjectId(patientId) });
		} catch (error) {
			console.error("Error in findByPatient:", error);
			throw error;
		}
	}

	async login(email, password) {
		try {
			const user = await this.findOne({ email });

			if (!user) {
				return null;
			}

			const isMatch = password === user.password;

			if (!isMatch) {
				return null;
			}

			const { password: _, ...userWithoutPassword } = user;
			return userWithoutPassword;
		} catch (error) {
			console.error("Error in login:", error);
			throw error;
		}
	}

	async findActiveUsers(options = {}) {
		try {
			return await this.findAll({ active: true }, options);
		} catch (error) {
			console.error("Error in findActiveUsers:", error);
			throw error;
		}
	}

	async findByLastLoginDate(startDate, endDate) {
		try {
			const collection = await this.getCollection();
			return await collection
				.find({
					lastLogin: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				})
				.toArray();
		} catch (error) {
			console.error("Error in findByLastLoginDate:", error);
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
			};

			return await this.create(userWithHashedPassword);
		} catch (error) {
			console.error("Error in createUser:", error);
			throw error;
		}
	}

	getSignedJwtToken(user) {
		return jwt.sign(
			{ id: user._id, role: user.role },
			process.env.JWT_SECRET || "dentalclinicsecret",
			{ expiresIn: process.env.JWT_EXPIRE || "30d" }
		);
	}
}

export default new UserRepository();
