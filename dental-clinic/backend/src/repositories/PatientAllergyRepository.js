import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PatientAllergyRepository extends BaseRepository {
	constructor() {
		super("patientAllergies");
	}

	async findByPatientId(patientId, options = {}) {
		try {
			return await this.findAll(
				{
					patientId: new ObjectId(patientId),
				},
				options
			);
		} catch (error) {
			console.error("Error in findByPatientId:", error);
			throw error;
		}
	}

	async findByAllergyId(allergyId, options = {}) {
		try {
			return await this.findAll(
				{
					allergyId: new ObjectId(allergyId),
				},
				options
			);
		} catch (error) {
			console.error("Error in findByAllergyId:", error);
			throw error;
		}
	}

	async findByPatientAndAllergyId(patientId, allergyId) {
		try {
			const collection = await this.getCollection();
			return await collection.findOne({
				patientId: new ObjectId(patientId),
				allergyId: new ObjectId(allergyId),
			});
		} catch (error) {
			console.error("Error in findByPatientAndAllergyId:", error);
			throw error;
		}
	}

	async createPatientAllergy(data) {
		try {
			const formattedData = {
				...data,
				patientId: new ObjectId(data.patientId),
				allergyId: new ObjectId(data.allergyId),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			return await this.create(formattedData);
		} catch (error) {
			console.error("Error in createPatientAllergy:", error);
			throw error;
		}
	}

	async updatePatientAllergy(id, data) {
		try {
			return await this.update(id, {
				...data,
				updatedAt: new Date(),
			});
		} catch (error) {
			console.error("Error in updatePatientAllergy:", error);
			throw error;
		}
	}

	async updateStatus(id, status) {
		try {
			return await this.update(id, {
				status,
				updatedAt: new Date(),
			});
		} catch (error) {
			console.error("Error in updateStatus:", error);
			throw error;
		}
	}

	async deletePatientAllergy(id) {
		try {
			return await this.delete(id);
		} catch (error) {
			console.error("Error in deletePatientAllergy:", error);
			throw error;
		}
	}
}

export default new PatientAllergyRepository();
