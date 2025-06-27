import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			role,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const query = {};
		if (role && role !== "all") {
			query.role = role;
		}
		if (search) {
			query.$or = [
				{ email: { $regex: search, $options: "i" } },
				{ "profile.firstName": { $regex: search, $options: "i" } },
				{ "profile.lastName": { $regex: search, $options: "i" } },
			];
		}

		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const users = await UserRepository.findAll(query);

		const total = users.length;

		res.json({
			users,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / parseInt(limit)),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get users error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const user = await UserRepository.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Get user error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.post("/", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { email, password, role, firstName, lastName, ...roleSpecificData } =
			req.body;

		const existingUser = await UserRepository.findOne({ email });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "User already exists with this email" });
		}

		const user = new User({
			email,
			password,
			role,
			profile: {
				firstName,
				lastName,
			},
		});

		let roleProfile = null;

		if (role === "patient") {
			roleProfile = {
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
			await PatientRepository.create(roleProfile);
			user.patient = roleProfile._id;
		} else if (role === "doctor") {
			roleProfile = {
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
			await DoctorRepository.create(roleProfile);
			user.doctor = roleProfile._id;
		}

		await UserRepository.create(user);

		const savedUser = await UserRepository.findById(user._id);

		res.status(201).json({
			message: "User created successfully",
			user: savedUser,
		});
	} catch (error) {
		console.error("Create user error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const { firstName, lastName, isActive, ...updateData } = req.body;

		const user = await UserRepository.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (firstName || lastName) {
			user.profile = user.profile || {};
			if (firstName) user.profile.firstName = firstName;
			if (lastName) user.profile.lastName = lastName;
		}

		if (typeof isActive !== "undefined") {
			user.isActive = isActive;
		}

		Object.keys(updateData).forEach((key) => {
			if (key !== "password" && key !== "role") {
				user[key] = updateData[key];
			}
		});

		await UserRepository.update(user._id, user);

		const updatedUser = await UserRepository.findById(user._id);

		res.json({
			message: "User updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Update user error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
	try {
		const user = await UserRepository.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.patient) {
			await PatientRepository.delete(user.patient);
		}
		if (user.doctor) {
			await DoctorRepository.delete(user.doctor);
		}

		await UserRepository.delete(req.params.id);

		res.json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Delete user error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.patch(
	"/:id/toggle-status",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const user = await UserRepository.findById(req.params.id);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			user.isActive = !user.isActive;
			await UserRepository.update(user._id, user);

			res.json({
				message: `User ${
					user.isActive ? "activated" : "deactivated"
				} successfully`,
				isActive: user.isActive,
			});
		} catch (error) {
			console.error("Toggle user status error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.post(
	"/:id/reset-password",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { newPassword } = req.body;

			if (!newPassword) {
				return res.status(400).json({ message: "New password is required" });
			}

			const user = await UserRepository.findById(req.params.id);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			user.password = newPassword;
			await UserRepository.update(user._id, user);

			res.json({ message: "Password reset successfully" });
		} catch (error) {
			console.error("Reset password error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

router.get(
	"/stats/summary",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const totalUsers = await UserRepository.countDocuments();
			const activeUsers = await UserRepository.countDocuments({
				isActive: true,
			});
			const usersByRole = await UserRepository.aggregate([
				{
					$group: {
						_id: "$role",
						count: { $sum: 1 },
					},
				},
			]);

			const recentUsers = await UserRepository.find()
				.select("-password")
				.sort({ createdAt: -1 })
				.limit(5);

			res.json({
				totalUsers,
				activeUsers,
				inactiveUsers: totalUsers - activeUsers,
				usersByRole: usersByRole.reduce((acc, curr) => {
					acc[curr._id] = curr.count;
					return acc;
				}, {}),
				recentUsers,
			});
		} catch (error) {
			console.error("Get user stats error:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

export default router;
