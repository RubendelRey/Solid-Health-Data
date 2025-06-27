import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";
import InterventionRepository from "./InterventionRepository.js";

class DoctorRepository extends BaseRepository {
	constructor() {
		super("doctors");
	}

	async findByUserId(userId) {
		try {
			return await this.findOne({ userId: new ObjectId(userId) });
		} catch (error) {
			console.error("Error in findByUserId:", error);
			throw error;
		}
	}

	async findBySpecialty(specialty, options = {}) {
		try {
			return await this.findAll({ specialties: specialty }, options);
		} catch (error) {
			console.error("Error in findBySpecialty:", error);
			throw error;
		}
	}

	async isAvailable(doctorId, dateTime) {
		try {
			const appointmentDateTime =
				typeof dateTime === "string" ? new Date(dateTime) : dateTime;

			if (isNaN(appointmentDateTime)) {
				throw new Error("Invalid date");
			}

			const dayOfWeek = appointmentDateTime.getDay();
			const hours = appointmentDateTime.getHours();
			const minutes = appointmentDateTime.getMinutes();

			const doctor = await this.findById(doctorId);

			if (!doctor || !doctor.workHours) {
				return false;
			}

			const dayWorkHours = doctor.workHours.find((wh) => wh.day === dayOfWeek);

			if (!dayWorkHours) {
				return false;
			}

			const [morningStartHours, morningStartMinutes] = dayWorkHours.morningStart
				.split(":")
				.map((n) => parseInt(n));
			const [morningEndHours, morningEndMinutes] = dayWorkHours.morningEnd
				.split(":")
				.map((n) => parseInt(n));

			const [afternoonStartHours, afternoonStartMinutes] =
				dayWorkHours.afternoonStart.split(":").map((n) => parseInt(n));
			const [afternoonEndHours, afternoonEndMinutes] = dayWorkHours.afternoonEnd
				.split(":")
				.map((n) => parseInt(n));

			const isInMorningHours =
				(hours > morningStartHours ||
					(hours === morningStartHours && minutes >= morningStartMinutes)) &&
				(hours < morningEndHours ||
					(hours === morningEndHours && minutes < morningEndMinutes));

			const isInAfternoonHours =
				(hours > afternoonStartHours ||
					(hours === afternoonStartHours &&
						minutes >= afternoonStartMinutes)) &&
				(hours < afternoonEndHours ||
					(hours === afternoonEndHours && minutes < afternoonEndMinutes));

			return isInMorningHours || isInAfternoonHours;
		} catch (error) {
			console.error("Error in isAvailable:", error);
			throw error;
		}
	}

	async getAvailableTimeSlots(doctorId, date) {
		try {
			const dateObj = typeof date === "string" ? new Date(date) : date;

			if (isNaN(dateObj)) {
				throw new Error("Invalid date");
			}

			const dayOfWeek = dateObj.getDay();

			const doctor = await this.findById(doctorId);

			if (!doctor || !doctor.workHours) {
				return [];
			}

			const dayWorkHours = doctor.workHours.find((wh) => wh.day === dayOfWeek);

			if (!dayWorkHours) {
				return [];
			}

			const slots = [];

			const [morningStartHours, morningStartMinutes] = dayWorkHours.morningStart
				.split(":")
				.map((n) => parseInt(n));
			const [morningEndHours, morningEndMinutes] = dayWorkHours.morningEnd
				.split(":")
				.map((n) => parseInt(n));

			const [afternoonStartHours, afternoonStartMinutes] =
				dayWorkHours.afternoonStart.split(":").map((n) => parseInt(n));
			const [afternoonEndHours, afternoonEndMinutes] = dayWorkHours.afternoonEnd
				.split(":")
				.map((n) => parseInt(n));

			let currentHour = morningStartHours;
			let currentMinute = morningStartMinutes;

			currentMinute = Math.ceil(currentMinute / 15) * 15;
			if (currentMinute === 60) {
				currentHour += 1;
				currentMinute = 0;
			}

			while (
				currentHour < morningEndHours ||
				(currentHour === morningEndHours && currentMinute < morningEndMinutes)
			) {
				slots.push(
					`${currentHour.toString().padStart(2, "0")}:${currentMinute
						.toString()
						.padStart(2, "0")}`
				);

				currentMinute += 15;
				if (currentMinute === 60) {
					currentHour += 1;
					currentMinute = 0;
				}
			}

			currentHour = afternoonStartHours;
			currentMinute = afternoonStartMinutes;

			currentMinute = Math.ceil(currentMinute / 15) * 15;
			if (currentMinute === 60) {
				currentHour += 1;
				currentMinute = 0;
			}

			while (
				currentHour < afternoonEndHours ||
				(currentHour === afternoonEndHours &&
					currentMinute < afternoonEndMinutes)
			) {
				slots.push(
					`${currentHour.toString().padStart(2, "0")}:${currentMinute
						.toString()
						.padStart(2, "0")}`
				);

				currentMinute += 15;
				if (currentMinute === 60) {
					currentHour += 1;
					currentMinute = 0;
				}
			}

			const dateString = dateObj.toISOString().split("T")[0];

			const interventionRepo = InterventionRepository;
			const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
			const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

			const bookedInterventions = await interventionRepo.findAll({
				doctor: new ObjectId(doctorId),
				appointmentDate: {
					$gte: startOfDay.toISOString(),
					$lte: endOfDay.toISOString(),
				},
			});

			const availableSlots = [...slots];

			for (const intervention of bookedInterventions) {
				if (intervention.appointmentDate) {
					const appointmentDate = new Date(intervention.appointmentDate);
					const appointmentTime = `${appointmentDate
						.getHours()
						.toString()
						.padStart(2, "0")}:${appointmentDate
						.getMinutes()
						.toString()
						.padStart(2, "0")}`;

					const slotIndex = availableSlots.indexOf(appointmentTime);
					if (slotIndex !== -1) {
						availableSlots.splice(slotIndex, 1);
					}
				}
			}

			return availableSlots;
		} catch (error) {
			console.error("Error in getAvailableTimeSlots:", error);
			throw error;
		}
	}

	async findAvailableDoctors(date, timeSlot) {
		try {
			const dateObj = typeof date === "string" ? new Date(date) : date;

			if (isNaN(dateObj)) {
				throw new Error("Invalid date");
			}

			const allDoctors = await this.findAll();
			const availableDoctors = [];

			for (const doctor of allDoctors) {
				const dateTimeString = `${
					dateObj.toISOString().split("T")[0]
				}T${timeSlot}:00.000Z`;

				const isAvailable = await this.isAvailable(
					doctor._id.toString(),
					dateTimeString
				);

				if (isAvailable) {
					availableDoctors.push(doctor);
				}
			}

			return availableDoctors;
		} catch (error) {
			console.error("Error in findAvailableDoctors:", error);
			throw error;
		}
	}

	async updateProfile(doctorId, profileData) {
		try {
			const { userId, ...updateData } = profileData;

			return await this.update(doctorId, updateData);
		} catch (error) {
			console.error("Error in updateProfile:", error);
			throw error;
		}
	}

	async updateSpecialties(doctorId, specialties) {
		try {
			return await this.update(doctorId, { specialties });
		} catch (error) {
			console.error("Error in updateSpecialties:", error);
			throw error;
		}
	}
}

export default new DoctorRepository();
