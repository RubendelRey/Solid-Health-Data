import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PatientAllergyRepository extends BaseRepository {
	constructor() {
		super("patientAllergies");
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

	async findByAllergyId(allergyId, options = {}) {
		try {
			const _id =
				typeof allergyId === "string" ? new ObjectId(allergyId) : allergyId;
			return await this.findAll({ allergyId: _id }, options);
		} catch (error) {
			console.error("Error in findByAllergyId:", error);
			throw error;
		}
	}

	async findBySeverity(severity, options = {}) {
		try {
			return await this.findAll({ severity }, options);
		} catch (error) {
			console.error("Error in findBySeverity:", error);
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

	async getPatientAllergiesWithDetails(patientId) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;

			const pipeline = [
				{ $match: { patientId: _id } },
				{
					$lookup: {
						from: "allergyCatalog",
						localField: "allergyId",
						foreignField: "_id",
						as: "allergy",
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
					$unwind: { path: "$allergy", preserveNullAndEmptyArrays: true },
				},
				{
					$unwind: { path: "$doctor", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						diagnosedDate: 1,
						severity: 1,
						status: 1,
						notes: 1,
						symptoms: 1,
						treatment: 1,
						lastReaction: 1,
						verified: 1,
						createdAt: 1,
						updatedAt: 1,
						"allergy.name": 1,
						"allergy.description": 1,
						"allergy.code": 1,
						"allergy.category": 1,
						"doctor.firstName": 1,
						"doctor.lastName": 1,
						"doctor.specialization": 1,
						"doctor.licenseNumber": 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getPatientAllergiesWithDetails:", error);
			throw error;
		}
	}

	async getDoctorAllergiesWithDetails(doctorId, options = {}) {
		try {
			const _id =
				typeof doctorId === "string" ? new ObjectId(doctorId) : doctorId;

			const pipeline = [
				{ $match: { doctorId: _id } },
				{
					$lookup: {
						from: "allergyCatalog",
						localField: "allergyId",
						foreignField: "_id",
						as: "allergy",
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
					$unwind: { path: "$allergy", preserveNullAndEmptyArrays: true },
				},
				{
					$unwind: { path: "$patient", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						diagnosedDate: 1,
						severity: 1,
						status: 1,
						notes: 1,
						symptoms: 1,
						treatment: 1,
						lastReaction: 1,
						verified: 1,
						createdAt: 1,
						updatedAt: 1,
						"allergy.name": 1,
						"allergy.description": 1,
						"allergy.code": 1,
						"allergy.category": 1,
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
			console.error("Error in getDoctorAllergiesWithDetails:", error);
			throw error;
		}
	}

	async checkPatientAllergy(patientId, allergyId) {
		try {
			const patientObjectId =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;
			const allergyObjectId =
				typeof allergyId === "string" ? new ObjectId(allergyId) : allergyId;

			return await this.findOne({
				patientId: patientObjectId,
				allergyId: allergyObjectId,
				status: "active",
			});
		} catch (error) {
			console.error("Error in checkPatientAllergy:", error);
			throw error;
		}
	}

	async updateSeverity(allergyRecordId, severity, notes = null) {
		try {
			const updateData = { severity };
			if (notes) updateData.notes = notes;

			return await this.update(allergyRecordId, updateData);
		} catch (error) {
			console.error("Error in updateSeverity:", error);
			throw error;
		}
	}

	async recordReaction(
		allergyRecordId,
		reactionDate,
		symptoms,
		treatment = null
	) {
		try {
			return await this.update(allergyRecordId, {
				lastReaction: new Date(reactionDate),
				symptoms: symptoms,
				treatment: treatment,
				verified: true,
			});
		} catch (error) {
			console.error("Error in recordReaction:", error);
			throw error;
		}
	}

	async deactivateAllergy(allergyRecordId, notes = null) {
		try {
			const updateData = { status: "inactive" };
			if (notes) updateData.notes = notes;

			return await this.update(allergyRecordId, updateData);
		} catch (error) {
			console.error("Error in deactivateAllergy:", error);
			throw error;
		}
	}

	async activateAllergy(allergyRecordId, notes = null) {
		try {
			const updateData = { status: "active" };
			if (notes) updateData.notes = notes;

			return await this.update(allergyRecordId, updateData);
		} catch (error) {
			console.error("Error in activateAllergy:", error);
			throw error;
		}
	}

	async getAllergyStatistics() {
		try {
			const pipeline = [
				{
					$group: {
						_id: "$severity",
						count: { $sum: 1 },
					},
				},
				{
					$project: {
						severity: "$_id",
						count: 1,
						_id: 0,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getAllergyStatistics:", error);
			throw error;
		}
	}

	async getCriticalAllergies(options = {}) {
		try {
			return await this.getPatientAllergiesWithDetails({
				severity: { $in: ["severe", "critical"] },
				status: "active",
			});
		} catch (error) {
			console.error("Error in getCriticalAllergies:", error);
			throw error;
		}
	}
}

export default new PatientAllergyRepository();
