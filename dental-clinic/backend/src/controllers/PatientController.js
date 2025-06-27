import PatientAllergyService from "../services/PatientAllergyService.js";
import PatientService from "../services/PatientService.js";

class PatientController {
	async getPatients(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "-createdAt";
		const name = req.query.name || "";

		const query = {};
		if (name) {
			query.name = { $regex: name, $options: "i" };
		}

		const options = { sort: sort };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const result = await PatientService.getAllPatients(query, options);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async createPatient(req, res) {
		try {
			const patient = await PatientService.createPatient(req.body);
			res.status(201).json(patient);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPatient(req, res) {
		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId.toString() !== req.params.id
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to access this patient" });
			}

			const patient = await PatientService.getPatientById(req.params.id);
			res.status(200).json(patient);
		} catch (error) {
			res.status(404).json({ error: error.message });
		}
	}

	async updatePatient(req, res) {
		try {
			const patient = await PatientService.updatePatient(
				req.params.id,
				req.body
			);
			res.status(200).json(patient);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async deletePatient(req, res) {
		try {
			await PatientService.deletePatient(req.params.id);
			res.status(200).json({});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async addAllergy(req, res) {
		try {
			const patientAllergy = await PatientAllergyService.addAllergyToPatient(
				req.params.id,
				req.body
			);
			res.status(200).json({
				success: true,
				data: patientAllergy,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPatientAllergies(req, res) {
		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId.toString() !== req.params.id
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to access this patient" });
			}

			const result = await PatientAllergyService.getPatientAllergies(
				req.params.id
			);
			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateAllergy(req, res) {
		try {
			const patientAllergy = await PatientAllergyService.updatePatientAllergy(
				req.params.allergyRelationId,
				req.body
			);
			res.status(200).json({ success: true, data: patientAllergy });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateAllergyStatus(req, res) {
		try {
			const { status } = req.body;
			if (!status) {
				return res.status(400).json({ error: "Status is required" });
			}

			const patientAllergy = await PatientAllergyService.updateAllergyStatus(
				req.params.allergyRelationId,
				status
			);
			res.status(200).json({ success: true, data: patientAllergy });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async removeAllergy(req, res) {
		try {
			const success = await PatientAllergyService.removePatientAllergy(
				req.params.allergyRelationId
			);
			res.status(200).json({ success });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPatientsWithAllergy(req, res) {
		try {
			const { allergyId } = req.params;
			const result = await PatientAllergyService.getPatientsWithAllergy(
				allergyId
			);
			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

export default new PatientController();
