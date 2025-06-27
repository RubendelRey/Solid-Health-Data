import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class UserService {
	async getAllUsers() {
		try {
			const users = await UserRepository.findAll();
			return users.map((user) => ({
				_id: user._id,
				name: user.name,
				surname: user.surname,
				fullName: user.surname ? `${user.name} ${user.surname}` : user.name,
				email: user.email,
				role: user.role,
				patientId: user.patientId,
				doctorId: user.doctorId,
				isActive: user.isActive !== false,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			}));
		} catch (error) {
			throw error;
		}
	}
	async getUserById(userId) {
		try {
			const user = await UserRepository.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}
			return {
				_id: user._id,
				name: user.name,
				surname: user.surname,
				fullName: user.surname ? `${user.name} ${user.surname}` : user.name,
				email: user.email,
				role: user.role,
				patientId: user.patientId,
				doctorId: user.doctorId,
				isActive: user.isActive !== false,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};
		} catch (error) {
			throw error;
		}
	}

	async createUser(userData) {
		try {
			const existingUser = await UserRepository.findByEmail(userData.email);

			if (existingUser) {
				throw new Error("User already exists");
			}

			let user;

			if (userData.role === "patient") {
				if (!userData.name || !userData.surname || !userData.patientData) {
					throw new Error(
						"Name, surname and patient data are required for patient registration"
					);
				}

				if (userData.patientData.nif) {
					const existingPatient = await PatientRepository.findByNif(
						userData.patientData.nif
					);
					if (existingPatient) {
						throw new Error("Patient with this NIF already exists");
					}
				} else {
					throw new Error("NIF is required for patient registration");
				}

				const patient = await PatientRepository.create({
					...userData.patientData,
					name: userData.name,
					surname: userData.surname,
					email: userData.email,
				});

				user = await UserRepository.create({
					name: userData.name,
					surname: userData.surname,
					email: userData.email,
					password: userData.password,
					role: "patient",
					patientId: patient._id,
				});
			} else if (userData.role === "doctor") {
				if (
					!userData.name ||
					!userData.surname ||
					!userData.email ||
					!userData.password ||
					!userData.doctorData
				) {
					throw new Error(
						"Name, surname, email, password and doctor data are required for doctor registration"
					);
				}

				const defaultWorkHours = [
					{
						day: 1,
						morningStart: "09:00",
						morningEnd: "14:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 2,
						morningStart: "09:00",
						morningEnd: "14:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 3,
						morningStart: "09:00",
						morningEnd: "14:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 4,
						morningStart: "09:00",
						morningEnd: "14:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 5,
						morningStart: "09:00",
						morningEnd: "14:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
				];

				user = await UserRepository.create({
					name: userData.name,
					surname: userData.surname,
					email: userData.email,
					password: userData.password,
					role: "doctor",
				});

				const doctor = await DoctorRepository.create({
					name: userData.name,
					surname: userData.surname,
					specialization: userData.doctorData.specialization,
					collegiateNumber: userData.doctorData.collegiateNumber,
					license: userData.doctorData.license,
					email: userData.email,
					userId: user._id,
					qualifications: userData.doctorData.qualifications || [],
					specialties: userData.doctorData.specialties || [],
					biography: userData.doctorData.biography || "",
					workHours: userData.doctorData.workHours || defaultWorkHours,
				});

				await UserRepository.update(user._id, { doctorId: doctor._id });
			} else {
				user = await UserRepository.create(userData);
			}

			return {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				patientId: user.patientId,
				doctorId: user.doctorId,
			};
		} catch (error) {
			throw error;
		}
	}

	async updateUser(userId, updateData) {
		try {
			const user = await UserRepository.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			const { password, ...safeUpdateData } = updateData;

			const updatedUser = await UserRepository.update(userId, safeUpdateData);

			return {
				name: updatedUser.name,
				email: updatedUser.email,
				role: updatedUser.role,
				isActive: updatedUser.isActive,
				updatedAt: updatedUser.updatedAt,
			};
		} catch (error) {
			throw error;
		}
	}

	async deleteUser(userId) {
		try {
			const user = await UserRepository.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			if (user.role === "patient" && user.patientId) {
				await PatientRepository.delete(user.patientId);
			} else if (user.role === "doctor" && user.doctorId) {
				throw new Error(
					"Cannot delete doctor accounts. Please deactivate the user instead."
				);
			}

			await UserRepository.delete(userId);
			return true;
		} catch (error) {
			throw error;
		}
	}

	async getUsersByRole(role) {
		try {
			const users = await UserRepository.findByRole(role);
			return users.map((user) => ({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				isActive: user.isActive !== false,
				createdAt: user.createdAt,
			}));
		} catch (error) {
			throw error;
		}
	}

	async changePassword(userId, newPassword) {
		try {
			const user = await UserRepository.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			await UserRepository.update(userId, { password: newPassword });
			return true;
		} catch (error) {
			throw error;
		}
	}

	async toggleUserStatus(userId) {
		try {
			const user = await UserRepository.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			const newStatus = !user.isActive;
			const updatedUser = await UserRepository.update(userId, {
				isActive: newStatus,
			});

			return {
				_id: updatedUser._id,
				name: updatedUser.name,
				email: updatedUser.email,
				isActive: updatedUser.isActive,
				message: `User ${newStatus ? "activated" : "deactivated"} successfully`,
			};
		} catch (error) {
			throw error;
		}
	}
}

export default new UserService();
