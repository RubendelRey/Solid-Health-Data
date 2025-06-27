import AllergyCatalogueRepository from "../repositories/AllergyCatalogueRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";

class PatientAllergyService {
	async getPatientAllergies(patientId) {
		try {
			const patient = await PatientRepository.findById(patientId);
			if (!patient) {
				throw new Error("Patient not found");
			}

			const patientAllergies = await PatientAllergyRepository.findByPatientId(
				patientId
			);

			if (!patientAllergies || patientAllergies.length === 0) {
				return { allergies: [] };
			}

			const allergiesWithDetails = [];

			for (const patientAllergy of patientAllergies) {
				const allergyDetails = await AllergyCatalogueRepository.findById(
					patientAllergy.allergyId
				);

				if (allergyDetails) {
					allergiesWithDetails.push({
						_id: patientAllergy._id,
						allergyId: patientAllergy.allergyId,
						status: patientAllergy.status || "active",
						severity: patientAllergy.severity || "low",
						notes: patientAllergy.notes || "",
						detectionDate:
							patientAllergy.detectionDate || patientAllergy.createdAt,

						name: allergyDetails.name,
						type: allergyDetails.type,
						description: allergyDetails.description,
						code: allergyDetails.code,
					});
				}
			}

			return { allergies: allergiesWithDetails };
		} catch (error) {
			console.error("Error in getPatientAllergies:", error);
			throw error;
		}
	}

	async addAllergyToPatient(patientId, allergyData) {
		try {
			const patient = await PatientRepository.findById(patientId);
			if (!patient) {
				throw new Error("Patient not found");
			}

			const allergyCatalogue = await AllergyCatalogueRepository.findByCode(
				allergyData.allergyCode
			);
			if (!allergyCatalogue) {
				throw new Error("Allergy not found in catalogue");
			}

			const existingRelation =
				await PatientAllergyRepository.findByPatientAndAllergyId(
					patientId,
					allergyData.allergyId
				);

			if (existingRelation) {
				throw new Error("This allergy is already associated with the patient");
			}

			const patientAllergy =
				await PatientAllergyRepository.createPatientAllergy({
					patientId,
					allergyId: allergyData.allergyId,
					severity: allergyData.severity || "low",
					status: allergyData.status || "active",
					notes: allergyData.notes || "",
					detectionDate: allergyData.detectionDate || new Date(),
				});

			return patientAllergy;
		} catch (error) {
			console.error("Error in addAllergyToPatient:", error);
			throw error;
		}
	}

	async updatePatientAllergy(id, allergyData) {
		try {
			const patientAllergy = await PatientAllergyRepository.findById(id);
			if (!patientAllergy) {
				throw new Error("Patient allergy relationship not found");
			}

			return await PatientAllergyRepository.updatePatientAllergy(
				id,
				allergyData
			);
		} catch (error) {
			console.error("Error in updatePatientAllergy:", error);
			throw error;
		}
	}

	async updateAllergyStatus(id, status) {
		try {
			const validStatuses = ["active", "inactive"];

			if (!validStatuses.includes(status)) {
				throw new Error("Invalid status value");
			}

			const patientAllergy = await PatientAllergyRepository.findById(id);
			if (!patientAllergy) {
				throw new Error("Patient allergy relationship not found");
			}

			return await PatientAllergyRepository.updateStatus(id, status);
		} catch (error) {
			console.error("Error in updateAllergyStatus:", error);
			throw error;
		}
	}

	async removePatientAllergy(id) {
		try {
			const patientAllergy = await PatientAllergyRepository.findById(id);
			if (!patientAllergy) {
				throw new Error("Patient allergy relationship not found");
			}

			return await PatientAllergyRepository.deletePatientAllergy(id);
		} catch (error) {
			console.error("Error in removePatientAllergy:", error);
			throw error;
		}
	}

	async getPatientsWithAllergy(allergyId) {
		try {
			const patientAllergies = await PatientAllergyRepository.findByAllergyId(
				allergyId
			);

			if (!patientAllergies || patientAllergies.length === 0) {
				return { patients: [] };
			}

			const allergyDetails = await AllergyCatalogueRepository.findById(
				allergyId
			);
			if (!allergyDetails) {
				throw new Error("Allergy not found in catalogue");
			}

			const patients = [];

			for (const relation of patientAllergies) {
				const patient = await PatientRepository.findById(relation.patientId);

				if (patient) {
					patients.push({
						...patient,
						allergyDetails: {
							severity: relation.severity,
							status: relation.status,
							detectionDate: relation.detectionDate,
							notes: relation.notes,
							relationId: relation._id,
						},
					});
				}
			}

			return {
				allergy: allergyDetails,
				patients: patients,
				count: patients.length,
			};
		} catch (error) {
			console.error("Error in getPatientsWithAllergy:", error);
			throw error;
		}
	}
}

export default new PatientAllergyService();
