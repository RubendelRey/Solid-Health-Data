import DoctorRepository from "../repositories/DoctorRepository.js";
import InterventionRepository from "../repositories/InterventionRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class DoctorService {
	async getAllDoctors(query = {}, options = {}) {
		try {
			const doctors = await DoctorRepository.findAll(query, options);
			const count = await DoctorRepository.count(query);

			const doctorsWithUserInfo = [];
			for (const doctor of doctors) {
				const user = await UserRepository.findById(doctor.userId);
				if (user) {
					doctorsWithUserInfo.push({
						...doctor,
						name: user.name,
						email: user.email,
					});
				}
			}

			return {
				count,
				doctors: doctorsWithUserInfo,
			};
		} catch (error) {
			throw error;
		}
	}

	async getDoctorById(id, includeUserInfo = true) {
		try {
			const doctor = await DoctorRepository.findById(id);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			if (includeUserInfo) {
				const user = await UserRepository.findById(doctor.userId);

				if (user) {
					return {
						...doctor,
						name: user.name,
						email: user.email,
					};
				}
			}

			return doctor;
		} catch (error) {
			throw error;
		}
	}

	async createDoctor(doctorData, userId = null) {
		try {
			if (userId) {
				const user = await UserRepository.findById(userId);

				if (!user) {
					throw new Error("User not found");
				}

				if (user.role !== "doctor") {
					throw new Error("User is not a doctor");
				}

				const existingDoctor = await DoctorRepository.findByUserId(userId);

				if (existingDoctor) {
					throw new Error("Doctor record already exists for this user");
				}

				doctorData.userId = userId;
			}

			if (!doctorData.workHours) {
				doctorData.workHours = [
					{
						day: 1,
						morningStart: "09:00",
						morningEnd: "13:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 2,
						morningStart: "09:00",
						morningEnd: "13:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 3,
						morningStart: "09:00",
						morningEnd: "13:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 4,
						morningStart: "09:00",
						morningEnd: "13:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
					{
						day: 5,
						morningStart: "09:00",
						morningEnd: "13:00",
						afternoonStart: "16:00",
						afternoonEnd: "20:00",
					},
				];
			}

			const doctor = await DoctorRepository.create(doctorData);

			return doctor;
		} catch (error) {
			throw error;
		}
	}

	async updateDoctor(id, doctorData) {
		try {
			const doctor = await DoctorRepository.update(id, doctorData);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			return doctor;
		} catch (error) {
			throw error;
		}
	}

	async deleteDoctor(id) {
		try {
			const doctor = await DoctorRepository.delete(id);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			return {};
		} catch (error) {
			throw error;
		}
	}

	async getAvailableTimeSlots(doctorId, date) {
		try {
			return await DoctorRepository.getAvailableTimeSlots(doctorId, date);
		} catch (error) {
			throw error;
		}
	}

	async isDoctorAvailable(doctorId, appointmentDateTime) {
		try {
			return await DoctorRepository.isAvailable(doctorId, appointmentDateTime);
		} catch (error) {
			throw error;
		}
	}

	async getDoctorPatients(doctorId, options = {}) {
		try {
			const doctor = await DoctorRepository.findByUserId(doctorId);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			const interventions = await InterventionRepository.findByDoctor(
				doctorId,
				{
					...options,
					populate: "patient",
				}
			);

			const patientIds = new Set();
			const patients = [];

			for (const intervention of interventions) {
				if (
					intervention.patient &&
					!patientIds.has(intervention.patient.toString())
				) {
					patientIds.add(intervention.patient.toString());

					const patient = await PatientRepository.findById(
						intervention.patient
					);
					if (patient) {
						patients.push(patient);
					}
				}
			}

			return {
				count: patients.length,
				patients,
			};
		} catch (error) {
			throw error;
		}
	}

	async getDoctorByUserId(userId) {
		try {
			const doctor = await DoctorRepository.findByUserId(userId);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			return doctor;
		} catch (error) {
			throw error;
		}
	}

	async getAvailableDoctors(date, timeSlot) {
		try {
			const doctors = await DoctorRepository.findAvailableDoctors(
				date,
				timeSlot
			);

			const doctorsWithUserInfo = [];
			for (const doctor of doctors) {
				const user = await UserRepository.findById(doctor.userId);
				if (user) {
					doctorsWithUserInfo.push({
						...doctor,
						name: user.name,
						email: user.email,
					});
				}
			}

			return doctorsWithUserInfo;
		} catch (error) {
			throw error;
		}
	}

	async updateWorkHours(doctorId, workHours) {
		try {
			this.validateWorkHours(workHours);

			const doctor = await DoctorRepository.update(doctorId, { workHours });

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			return doctor;
		} catch (error) {
			throw error;
		}
	}

	validateWorkHours(workHours) {
		if (!Array.isArray(workHours)) {
			throw new Error("Work hours must be an array");
		}

		for (const hours of workHours) {
			if (
				!("day" in hours) ||
				!("morningStart" in hours) ||
				!("morningEnd" in hours) ||
				!("afternoonStart" in hours) ||
				!("afternoonEnd" in hours)
			) {
				throw new Error(
					"Each work hours entry must have day, morningStart, morningEnd, afternoonStart and afternoonEnd"
				);
			}

			if (hours.day < 0 || hours.day > 6) {
				throw new Error(
					"Day must be between 0 and 6 (0 = Sunday, 6 = Saturday)"
				);
			}

			const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
			if (
				!timeRegex.test(hours.morningStart) ||
				!timeRegex.test(hours.morningEnd) ||
				!timeRegex.test(hours.afternoonStart) ||
				!timeRegex.test(hours.afternoonEnd)
			) {
				throw new Error("Time must be in HH:MM format");
			}

			const checkTimeOrder = (start, end, period) => {
				const [startHours, startMins] = start
					.split(":")
					.map((n) => parseInt(n));
				const [endHours, endMins] = end.split(":").map((n) => parseInt(n));

				if (
					startHours > endHours ||
					(startHours === endHours && startMins >= endMins)
				) {
					throw new Error(`${period} end time must be after start time`);
				}
			};

			checkTimeOrder(hours.morningStart, hours.morningEnd, "Morning");
			checkTimeOrder(hours.afternoonStart, hours.afternoonEnd, "Afternoon");

			const [morningEndHours, morningEndMins] = hours.morningEnd
				.split(":")
				.map((n) => parseInt(n));
			const [afternoonStartHours, afternoonStartMins] = hours.afternoonStart
				.split(":")
				.map((n) => parseInt(n));

			if (
				morningEndHours > afternoonStartHours ||
				(morningEndHours === afternoonStartHours &&
					morningEndMins > afternoonStartMins)
			) {
				throw new Error("Morning end time must be before afternoon start time");
			}
		}
	}

	async getFutureAppointments(doctorId) {
		try {
			const now = new Date();
			const interventions = await InterventionRepository.findAll(
				{
					doctor: doctorId,
					appointmentDate: { $gt: now.toISOString() },
				},
				{
					sort: { appointmentDate: 1 },
					populate: "patient interventionType",
				}
			);

			return interventions;
		} catch (error) {
			throw error;
		}
	}

	async getPastAppointments(doctorId) {
		try {
			const now = new Date();
			const interventions = await InterventionRepository.findAll(
				{
					doctor: doctorId,
					appointmentDate: { $lt: now.toISOString() },
				},
				{
					sort: { appointmentDate: -1 },
					populate: "patient interventionType",
				}
			);

			return interventions;
		} catch (error) {
			throw error;
		}
	}
}

export default new DoctorService();
