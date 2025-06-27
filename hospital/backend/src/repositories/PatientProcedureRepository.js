import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PatientProcedureRepository extends BaseRepository {
	constructor() {
		super("patientProcedures");
	}

	async findByPatientId(patientId, options = {}) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;
			return await this.findAll({ patient: _id }, options);
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

	async findByProcedureId(procedureId, options = {}) {
		try {
			const _id =
				typeof procedureId === "string"
					? new ObjectId(procedureId)
					: procedureId;
			return await this.findAll({ procedureId: _id }, options);
		} catch (error) {
			console.error("Error in findByProcedureId:", error);
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
					performedDate: {
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

	async getPatientProceduresWithDetails(patientId) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;

			const pipeline = [
				{ $match: { patientId: _id } },
				{
					$lookup: {
						from: "procedureCatalog",
						localField: "procedureId",
						foreignField: "_id",
						as: "procedure",
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
					$unwind: { path: "$procedure", preserveNullAndEmptyArrays: true },
				},
				{
					$unwind: { path: "$doctor", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						performedDate: 1,
						status: 1,
						notes: 1,
						results: 1,
						complications: 1,
						followUpRequired: 1,
						followUpDate: 1,
						createdAt: 1,
						updatedAt: 1,
						"procedure.name": 1,
						"procedure.description": 1,
						"procedure.code": 1,
						"procedure.category": 1,
						"doctor.firstName": 1,
						"doctor.lastName": 1,
						"doctor.specialization": 1,
						"doctor.licenseNumber": 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getPatientProceduresWithDetails:", error);
			throw error;
		}
	}

	async getDoctorProceduresWithDetails(doctorId, options = {}) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;

			const pipeline = [
				{ $match: { doctorId: _id } },
				{
					$lookup: {
						from: "procedureCatalog",
						localField: "procedureId",
						foreignField: "_id",
						as: "procedure",
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
				{
					$unwind: { path: "$procedure", preserveNullAndEmptyArrays: true },
				},
				{
					$unwind: { path: "$patient", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						performedDate: 1,
						status: 1,
						notes: 1,
						results: 1,
						complications: 1,
						followUpRequired: 1,
						followUpDate: 1,
						createdAt: 1,
						updatedAt: 1,
						"procedure.name": 1,
						"procedure.description": 1,
						"procedure.code": 1,
						"procedure.category": 1,
						"patient.firstName": 1,
						"patient.lastName": 1,
						"patient.documentId": 1,
					},
				},
			];

			if (options.sort) {
				pipeline.push({ $sort: options.sort });
			}

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getDoctorProceduresWithDetails:", error);
			throw error;
		}
	}

	async getUpcomingProcedures(options = {}) {
		try {
			const now = new Date();
			return await this.findAll(
				{
					performedDate: { $gte: now },
					status: { $in: ["scheduled", "confirmed"] },
				},
				options
			);
		} catch (error) {
			console.error("Error in getUpcomingProcedures:", error);
			throw error;
		}
	}

	async updateStatus(procedureId, status, notes = null, results = null) {
		try {
			const updateData = { status };
			if (notes) updateData.notes = notes;
			if (results) updateData.results = results;

			return await this.update(procedureId, updateData);
		} catch (error) {
			console.error("Error in updateStatus:", error);
			throw error;
		}
	}

	async addFollowUp(procedureId, followUpDate, notes) {
		try {
			return await this.update(procedureId, {
				followUpRequired: true,
				followUpDate: new Date(followUpDate),
				followUpNotes: notes,
			});
		} catch (error) {
			console.error("Error in addFollowUp:", error);
			throw error;
		}
	}

	async getProcedureStatistics() {
		try {
			const pipeline = [
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
				{
					$project: {
						status: "$_id",
						count: 1,
						_id: 0,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getProcedureStatistics:", error);
			throw error;
		}
	}
}

export default new PatientProcedureRepository();
