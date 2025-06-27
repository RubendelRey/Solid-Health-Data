import UserRepository from "../repositories/UserRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import DoctorRepository from "../repositories/DoctorRepository.js";

class AuthService {
	async register(userData) {
		try {
			const existingUser = await UserRepository.findByEmail(userData.email);

			if (existingUser) {
				throw new Error("User already exists");
			}

			let user;

			if (userData.role === "patient") {
				if (!userData.patientData) {
					throw new Error("Patient data is required for patient registration");
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
					email: userData.email,
				});

				user = await UserRepository.create({
					name: userData.name,
					email: userData.email,
					password: userData.password,
					role: "patient",
					patientId: patient._id,
				});
			} else if (userData.role === "doctor") {
				if (
					!userData.name ||
					!userData.email ||
					!userData.password ||
					!userData.doctorData
				) {
					throw new Error(
						"Name, email, password and doctor data are required for doctor registration"
					);
				}

				const doctor = await DoctorRepository.create({
					name: userData.name,
					specialization: userData.doctorData.specialization,
					collegiateNumber: userData.doctorData.collegiateNumber,
					email: userData.email,
					qualifications: userData.doctorData.qualifications || [],
					specialties: userData.doctorData.specialties || [],
					biography: userData.doctorData.biography || "",
				});

				user = await UserRepository.create({
					name: userData.name,
					email: userData.email,
					password: userData.password,
					role: "doctor",
					doctorId: doctor._id,
				});
			} else {
				user = await UserRepository.create(userData);
			}

			return {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				token: UserRepository.getSignedJwtToken(user),
			};
		} catch (error) {
			throw error;
		}
	}

	async login(email, password) {
		try {
			const user = await UserRepository.login(email, password);

			if (!user) {
				throw new Error("Invalid credentials");
			}

			return {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				token: UserRepository.getSignedJwtToken(user),
				patientId: user.patientId,
				doctorId: user.doctorId,
			};
		} catch (error) {
			throw error;
		}
	}
	async getMe(userId) {
		try {
			const user = await UserRepository.findById(userId);

			if (!user) {
				throw new Error("User not found");
			}

			return {
				name: user.name,
				email: user.email,
				role: user.role,
			};
		} catch (error) {
			throw error;
		}
	}

	async getAllUsers() {
		try {
			const users = await UserRepository.findAll();
			return users.map((user) => ({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				patientId: user.patientId,
				doctorId: user.doctorId,
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
				email: user.email,
				role: user.role,
				patientId: user.patientId,
				doctorId: user.doctorId,
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
					"Cannot delete doctor accounts at this time. Please contact system administrator."
				);
			}

			await UserRepository.delete(userId);
			return true;
		} catch (error) {
			throw error;
		}
	}
}

export default new AuthService();
