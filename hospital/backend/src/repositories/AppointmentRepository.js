import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class AppointmentRepository extends BaseRepository {
	constructor() {
		super("appointments");
	}

	async findByPatientId(patientId, options = {}) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;
			return await this.findAll({ patientId: _id }, options);
		} catch (error) {
			console.error("Error in findByPatientId:", error);
			throw error;
		}
	}

	async findByDoctorId(doctorId, options = {}) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;
			return await this.findAll({ doctorId: _id }, options);
		} catch (error) {
			console.error("Error in findByDoctorId:", error);
			throw error;
		}
	}

	async findByStatus(status, options = {}) {
		try {
			return await this.findAll({ status }, options);
		} catch (error) {
			console.error("Error in findByStatus:", error);
			throw error;
		}
	}

	async findByDateRange(startDate, endDate, options = {}) {
		try {
			return await this.findAll(
				{
					scheduledDate: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findByDateRange:", error);
			throw error;
		}
	}

	async findUpcomingAppointments(options = {}) {
		try {
			const now = new Date();
			return await this.findAll(
				{
					scheduledDate: { $gte: now },
					status: { $in: ["scheduled", "confirmed"] },
				},
				options
			);
		} catch (error) {
			console.error("Error in findUpcomingAppointments:", error);
			throw error;
		}
	}

	async findTodayAppointments(options = {}) {
		try {
			const today = new Date();
			const startOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate()
			);
			const endOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 1
			);

			return await this.findAll(
				{
					scheduledDate: {
						$gte: startOfDay,
						$lt: endOfDay,
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findTodayAppointments:", error);
			throw error;
		}
	}

	async checkAvailability(doctorId, scheduledDate) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;
			const appointmentDate = new Date(scheduledDate);

			const conflictStart = new Date(appointmentDate.getTime() - 30 * 60000);
			const conflictEnd = new Date(appointmentDate.getTime() + 30 * 60000);

			const existingAppointment = await this.findOne({
				doctorId: _id,
				scheduledDate: {
					$gte: conflictStart,
					$lte: conflictEnd,
				},
				status: { $in: ["scheduled", "confirmed"] },
			});

			return !existingAppointment;
		} catch (error) {
			console.error("Error in checkAvailability:", error);
			throw error;
		}
	}

	async getAppointmentsWithDetails(query = {}, options = {}) {
		try {
			const pipeline = [
				{ $match: query },
				{
					$lookup: {
						from: "patients",
						localField: "patientId",
						foreignField: "_id",
						as: "patient",
					},
				},
				{
					$lookup: {
						from: "doctors",
						localField: "doctorId",
						foreignField: "_id",
						as: "doctor",
					},
				},
				{
					$unwind: { path: "$patient", preserveNullAndEmptyArrays: true },
				},
				{
					$unwind: { path: "$doctor", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						scheduledDate: 1,
						status: 1,
						reason: 1,
						notes: 1,
						type: 1,
						createdAt: 1,
						updatedAt: 1,
						"patient.firstName": 1,
						"patient.lastName": 1,
						"patient.documentId": 1,
						"patient.phone": 1,
						"doctor.firstName": 1,
						"doctor.lastName": 1,
						"doctor.specialization": 1,
						"doctor.licenseNumber": 1,
					},
				},
			];

			if (options.sort) {
				pipeline.push({ $sort: options.sort });
			}

			if (options.limit) {
				pipeline.push({ $limit: options.limit });
			}

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getAppointmentsWithDetails:", error);
			throw error;
		}
	}

	async updateStatus(appointmentId, status, notes = null) {
		try {
			const updateData = { status };
			if (notes) {
				updateData.notes = notes;
			}
			return await this.update(appointmentId, updateData);
		} catch (error) {
			console.error("Error in updateStatus:", error);
			throw error;
		}
	}

	async getDoctorAppointmentsByDate(doctorId, date) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;
			const appointmentDate = new Date(date);
			const startOfDay = new Date(
				appointmentDate.getFullYear(),
				appointmentDate.getMonth(),
				appointmentDate.getDate()
			);
			const endOfDay = new Date(
				appointmentDate.getFullYear(),
				appointmentDate.getMonth(),
				appointmentDate.getDate() + 1
			);

			return await this.getAppointmentsWithDetails(
				{
					doctorId: _id,
					scheduledDate: {
						$gte: startOfDay,
						$lt: endOfDay,
					},
				},
				{ sort: { scheduledDate: 1 } }
			);
		} catch (error) {
			console.error("Error in getDoctorAppointmentsByDate:", error);
			throw error;
		}
	}

	async getPatientAppointmentHistory(patientId, options = {}) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;
			return await this.getAppointmentsWithDetails(
				{ patientId: _id },
				{
					sort: { scheduledDate: -1 },
					...options,
				}
			);
		} catch (error) {
			console.error("Error in getPatientAppointmentHistory:", error);
			throw error;
		}
	}
}

export default new AppointmentRepository();
