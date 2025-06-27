import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PatientRepository extends BaseRepository {
	constructor() {
		super("patients");
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

	async findByDocumentId(documentId) {
		try {
			return await this.findOne({ documentId });
		} catch (error) {
			console.error("Error in findByDocumentId:", error);
			throw error;
		}
	}

	async findByEmail(email) {
		try {
			return await this.findOne({ email });
		} catch (error) {
			console.error("Error in findByEmail:", error);
			throw error;
		}
	}

	async findByPhone(phone) {
		try {
			return await this.findOne({ phone });
		} catch (error) {
			console.error("Error in findByPhone:", error);
			throw error;
		}
	}

	async findByGender(gender, options = {}) {
		try {
			return await this.findAll({ gender }, options);
		} catch (error) {
			console.error("Error in findByGender:", error);
			throw error;
		}
	}

	async findByAgeRange(minAge, maxAge, options = {}) {
		try {
			const currentDate = new Date();
			const maxBirthDate = new Date(
				currentDate.getFullYear() - minAge,
				currentDate.getMonth(),
				currentDate.getDate()
			);
			const minBirthDate = new Date(
				currentDate.getFullYear() - maxAge,
				currentDate.getMonth(),
				currentDate.getDate()
			);

			return await this.findAll(
				{
					dateOfBirth: {
						$gte: minBirthDate,
						$lte: maxBirthDate,
					},
				},
				options
			);
		} catch (error) {
			console.error("Error in findByAgeRange:", error);
			throw error;
		}
	}

	async searchPatients(searchTerm, options = {}) {
		try {
			const query = {
				$or: [
					{ firstName: { $regex: searchTerm, $options: "i" } },
					{ lastName: { $regex: searchTerm, $options: "i" } },
					{ documentId: { $regex: searchTerm, $options: "i" } },
					{ email: { $regex: searchTerm, $options: "i" } },
					{ phone: { $regex: searchTerm, $options: "i" } },
				],
			};
			return await this.findAll(query, options);
		} catch (error) {
			console.error("Error in searchPatients:", error);
			throw error;
		}
	}

	async getPatientsWithProcedures(options = {}) {
		try {
			const pipeline = [
				{
					$lookup: {
						from: "patientProcedures",
						localField: "_id",
						foreignField: "patientId",
						as: "procedures",
					},
				},
				{
					$lookup: {
						from: "procedureCatalog",
						localField: "procedures.procedureId",
						foreignField: "_id",
						as: "procedureDetails",
					},
				},
				{
					$project: {
						firstName: 1,
						lastName: 1,
						documentId: 1,
						email: 1,
						phone: 1,
						dateOfBirth: 1,
						gender: 1,
						procedures: 1,
						procedureDetails: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getPatientsWithProcedures:", error);
			throw error;
		}
	}

	async getPatientsWithAllergies(options = {}) {
		try {
			const pipeline = [
				{
					$lookup: {
						from: "patientAllergies",
						localField: "_id",
						foreignField: "patientId",
						as: "allergies",
					},
				},
				{
					$lookup: {
						from: "allergyCatalog",
						localField: "allergies.allergyId",
						foreignField: "_id",
						as: "allergyDetails",
					},
				},
				{
					$project: {
						firstName: 1,
						lastName: 1,
						documentId: 1,
						email: 1,
						phone: 1,
						dateOfBirth: 1,
						gender: 1,
						allergies: 1,
						allergyDetails: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			];

			return await this.aggregate(pipeline);
		} catch (error) {
			console.error("Error in getPatientsWithAllergies:", error);
			throw error;
		}
	}

	async getPatientFullData(patientId) {
		try {
			const _id =
				typeof patientId === "string" ? new ObjectId(patientId) : patientId;

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
						from: "patientProcedures",
						localField: "_id",
						foreignField: "patientId",
						as: "procedures",
					},
				},
				{
					$lookup: {
						from: "patientAllergies",
						localField: "_id",
						foreignField: "patientId",
						as: "allergies",
					},
				},
				{
					$lookup: {
						from: "appointments",
						localField: "_id",
						foreignField: "patientId",
						as: "appointments",
					},
				},
			];

			const results = await this.aggregate(pipeline);
			return results.length > 0 ? results[0] : null;
		} catch (error) {
			console.error("Error in getPatientFullData:", error);
			throw error;
		}
	}
}

export default new PatientRepository();
