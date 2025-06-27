import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class DoctorRepository extends BaseRepository {
	constructor() {
		super("doctors");
	}

	async findByUserId(userId) {
		try {
			const _id = typeof userId === "string" ? new ObjectId(userId) : userId;
			return await this.findOne({ userId: _id });
		} catch (error) {
			console.error("Error in findByUserId:", error);
			throw error;
		}
	}

	async findByLicenseNumber(licenseNumber) {
		try {
			return await this.findOne({ licenseNumber });
		} catch (error) {
			console.error("Error in findByLicenseNumber:", error);
			throw error;
		}
	}

	async findBySpecialization(specialization, options = {}) {
		try {
			return await this.findAll({ specialization }, options);
		} catch (error) {
			console.error("Error in findBySpecialization:", error);
			throw error;
		}
	}

	async findAvailableDoctors(day, options = {}) {
		try {
			const workingHoursField = `workingHours.${day.toLowerCase()}.available`;
			return await this.findAll({ [workingHoursField]: true }, options);
		} catch (error) {
			console.error("Error in findAvailableDoctors:", error);
			throw error;
		}
	}

	async searchDoctors(searchTerm, options = {}) {
		try {
			const query = {
				$or: [
					{ firstName: { $regex: searchTerm, $options: "i" } },
					{ lastName: { $regex: searchTerm, $options: "i" } },
					{ specialization: { $regex: searchTerm, $options: "i" } },
					{ licenseNumber: { $regex: searchTerm, $options: "i" } },
					{ email: { $regex: searchTerm, $options: "i" } },
				],
			};
			return await this.findAll(query, options);
		} catch (error) {
			console.error("Error in searchDoctors:", error);
			throw error;
		}
	}

	async getDoctorsWithAppointments(options = {}) {
		try {
			const pipeline = [
				{
					$lookup: {
						from: "appointments",
						localField: "_id",
						foreignField: "doctorId",
						as: "appointments",
					},
				},
				{
					$project: {
						firstName: 1,
						lastName: 1,
						specialization: 1,
						licenseNumber: 1,
						email: 1,
						phone: 1,
						workingHours: 1,
						appointments: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getDoctorsWithAppointments:", error);
			throw error;
		}
	}

	async getDoctorFullData(doctorId) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;

			const pipeline = [
				{ $match: { _id } },
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "user",
					},
				},
				{
					$lookup: {
						from: "appointments",
						localField: "_id",
						foreignField: "doctorId",
						as: "appointments",
					},
				},
				{
					$lookup: {
						from: "patients",
						localField: "appointments.patientId",
						foreignField: "_id",
						as: "patients",
					},
				},
			];

			const results = await this.aggregate(pipeline);
			return results.length > 0 ? results[0] : null;
		} catch (error) {
			console.error("Error in getDoctorFullData:", error);
			throw error;
		}
	}

	async updateWorkingHours(doctorId, workingHours) {
		try {
			return await this.update(doctorId, { workingHours });
		} catch (error) {
			console.error("Error in updateWorkingHours:", error);
			throw error;
		}
	}

	async getDoctorSchedule(doctorId, startDate, endDate) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;

			const pipeline = [
				{ $match: { _id } },
				{
					$lookup: {
						from: "appointments",
						let: { doctorId: "$_id" },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ["$doctorId", "$$doctorId"] },
											{ $gte: ["$scheduledDate", new Date(startDate)] },
											{ $lte: ["$scheduledDate", new Date(endDate)] },
										],
									},
								},
							},
							{
								$lookup: {
									from: "patients",
									localField: "patientId",
									foreignField: "_id",
									as: "patient",
								},
							},
						],
						as: "appointments",
					},
				},
				{
					$project: {
						firstName: 1,
						lastName: 1,
						specialization: 1,
						workingHours: 1,
						appointments: 1,
					},
				},
			];

			const results = await this.aggregate(pipeline);
			return results.length > 0 ? results[0] : null;
		} catch (error) {
			console.error("Error in getDoctorSchedule:", error);
			throw error;
		}
	}
}

export default new DoctorRepository();
