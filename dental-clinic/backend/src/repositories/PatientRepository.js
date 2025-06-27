import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PatientRepository extends BaseRepository {
	constructor() {
		super("patients");
	}

	async findByNif(nif) {
		try {
			return await this.findOne({ nif });
		} catch (error) {
			console.error("Error in findByNif:", error);
			throw error;
		}
	}

	async findByCity(city, options = {}) {
		try {
			return await this.findAll({ "direction.city": city }, options);
		} catch (error) {
			console.error("Error in findByCity:", error);
			throw error;
		}
	}

	async findByAgeRange(minAge, maxAge, options = {}) {
		try {
			const today = new Date();
			const minBirthDate = new Date(
				today.getFullYear() - maxAge - 1,
				today.getMonth(),
				today.getDate()
			);
			minBirthDate.setDate(minBirthDate.getDate() + 1);
			const maxBirthDate = new Date(
				today.getFullYear() - minAge,
				today.getMonth(),
				today.getDate()
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

	async findByAllergy(allergyId, options = {}) {
		try {
			return await this.findAll(
				{
					"allergies.allergyId": new ObjectId(allergyId),
				},
				options
			);
		} catch (error) {
			console.error("Error in findByAllergy:", error);
			throw error;
		}
	}

	async addAllergy(patientId, allergyData) {
		try {
			const patient = await this.findById(patientId);

			if (!patient) {
				throw new Error(`Patient not found with id ${patientId}`);
			}

			const collection = await this.getCollection();
			const result = await collection.updateOne(
				{ _id: new ObjectId(patientId) },
				{
					$push: {
						allergies: {
							...allergyData,
							allergyId: new ObjectId(allergyData.allergyId),
							dateRecorded: new Date(),
						},
					},
					$set: { updatedAt: new Date() },
				}
			);

			if (result.modifiedCount === 0) {
				throw new Error("Failed to add allergy to patient");
			}

			return await this.findById(patientId);
		} catch (error) {
			console.error("Error in addAllergy:", error);
			throw error;
		}
	}

	async removeAllergy(patientId, allergyId) {
		try {
			const collection = await this.getCollection();
			const result = await collection.updateOne(
				{ _id: new ObjectId(patientId) },
				{
					$pull: {
						allergies: { _id: new ObjectId(allergyId) },
					},
					$set: { updatedAt: new Date() },
				}
			);

			if (result.modifiedCount === 0) {
				throw new Error("Failed to remove allergy from patient");
			}

			return await this.findById(patientId);
		} catch (error) {
			console.error("Error in removeAllergy:", error);
			throw error;
		}
	}

	async updateAllergyStatus(patientId, allergyId, status) {
		try {
			const collection = await this.getCollection();
			const result = await collection.updateOne(
				{
					_id: new ObjectId(patientId),
					"allergies._id": new ObjectId(allergyId),
				},
				{
					$set: {
						"allergies.$.status": status,
						updatedAt: new Date(),
					},
				}
			);

			if (result.modifiedCount === 0) {
				throw new Error("Failed to update allergy status");
			}

			return await this.findById(patientId);
		} catch (error) {
			console.error("Error in updateAllergyStatus:", error);
			throw error;
		}
	}
}

export default new PatientRepository();
