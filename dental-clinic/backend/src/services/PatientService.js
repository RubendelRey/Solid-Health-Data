import AllergyCatalogueRepository from "../repositories/AllergyCatalogueRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class PatientService {
	async getAllPatients(query = {}, options = {}) {
		try {
			const patients = await PatientRepository.findAll(query, options);
			const count = await PatientRepository.count(query);

			return {
				count,
				patients,
			};
		} catch (error) {
			throw error;
		}
	}

	async getPatientById(id) {
		try {
			const patient = await PatientRepository.findById(id);

			if (!patient) {
				throw new Error("Patient not found");
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}

	async createPatient(patientData, createUser = false) {
		try {
			const existingPatient = await PatientRepository.findByNIF(
				patientData.nif
			);

			if (existingPatient) {
				throw new Error("Patient with this NIF already exists");
			}

			const patient = await PatientRepository.create(patientData);

			if (createUser && patientData.email) {
				const existingUser = await UserRepository.findByEmail(
					patientData.email
				);

				if (!existingUser) {
					await UserRepository.create({
						name: `${patientData.name} ${patientData.surname}`,
						email: patientData.email,
						password: patientData.nif.slice(-6),
						role: "patient",
						patientId: patient._id,
					});
				}
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}

	async updatePatient(id, patientData) {
		try {
			const patient = await PatientRepository.update(id, patientData);

			if (!patient) {
				throw new Error("Patient not found");
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}

	async deletePatient(id) {
		try {
			const patient = await PatientRepository.delete(id);

			if (!patient) {
				throw new Error("Patient not found");
			}

			const user = await UserRepository.findByPatient(id);
			if (user) {
				await UserRepository.delete(user._id);
			}

			return {};
		} catch (error) {
			throw error;
		}
	}
	async addAllergyToPatient(patientId, allergyData) {
		try {
			const allergyCatalogue = await AllergyCatalogueRepository.findById(
				allergyData.allergyId
			);

			if (!allergyCatalogue) {
				throw new Error("Allergy not found in catalogue");
			}

			const patient = await PatientRepository.addAllergy(patientId, {
				allergyId: allergyData.allergyId,
				status: allergyData.status || "active",
				severity: allergyData.severity || "low",
				notes: allergyData.notes || "",
				dateRecorded: new Date(),
			});

			if (!patient) {
				throw new Error("Patient not found");
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}

	async updateAllergyStatus(patientId, allergyId, status) {
		try {
			const patient = await PatientRepository.updateAllergyStatus(
				patientId,
				allergyId,
				status
			);

			if (!patient) {
				throw new Error("Patient or allergy not found");
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}
	async getPatientAllergies(patientId) {
		try {
			const patient = await PatientRepository.findById(patientId);

			if (!patient) {
				throw new Error("Patient not found");
			}

			if (!patient.allergies || patient.allergies.length === 0) {
				return { allergies: [] };
			}

			const allergiesWithDetails = [];

			for (const patientAllergy of patient.allergies) {
				const allergyDetails = await AllergyCatalogueRepository.findById(
					patientAllergy.allergyId
				);

				if (allergyDetails) {
					allergiesWithDetails.push({
						_id: patientAllergy._id,
						allergyId: patientAllergy.allergyId,
						status: patientAllergy.status,
						severity: patientAllergy.severity,
						notes: patientAllergy.notes || "",
						dateRecorded: patientAllergy.dateRecorded,

						name: allergyDetails.name,
						type: allergyDetails.type,
						description: allergyDetails.description,
						code: allergyDetails.code,
					});
				}
			}

			return { allergies: allergiesWithDetails };
		} catch (error) {
			throw error;
		}
	}

	async removeAllergyFromPatient(patientId, allergyId) {
		try {
			const patient = await PatientRepository.removeAllergy(
				patientId,
				allergyId
			);

			if (!patient) {
				throw new Error("Patient or allergy not found");
			}

			return patient;
		} catch (error) {
			throw error;
		}
	}
}

export default new PatientService();
