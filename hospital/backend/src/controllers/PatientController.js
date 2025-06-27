import AppointmentRepository from "../repositories/AppointmentRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class PatientController {
	async getAll(req, res) {
		try {
			const { page = 1, limit = 10, search = "", active } = req.query;
			const skip = (page - 1) * limit;

			let query = {};
			if (search) {
				query.$or = [
					{ "name.0.given": { $regex: search, $options: "i" } },
					{ "name.0.family": { $regex: search, $options: "i" } },
					{ "identifier.0.value": { $regex: search, $options: "i" } },
				];
			}
			if (active !== undefined) {
				query.active = active === "true";
			}
			const options = {
				sort: { createdAt: -1 },
				limit: parseInt(limit),
				skip,
			};

			const patients = await PatientRepository.findAll(query, options);
			const totalCount = await PatientRepository.count(query);

			res.json({
				success: true,
				data: patients,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get patients error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving patients",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;
			const patient = await PatientRepository.findById(id);

			if (!patient) {
				return res.status(404).json({
					success: false,
					message: "Patient not found",
				});
			}

			const procedures = await PatientProcedureRepository.findAll({
				subject: patient._id,
			});
			const allergies = await PatientAllergyRepository.findAll({
				patient: patient._id,
			});
			const appointments = await AppointmentRepository.findAll({
				patient: patient._id,
			});

			res.json({
				success: true,
				data: {
					patient,
					procedures,
					allergies,
					appointments,
				},
			});
		} catch (error) {
			console.error("Get patient by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving patient",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			const { email, password, ...patientData } = req.body;

			const existingUser = await UserRepository.findByEmail(email);
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "User with this email already exists",
				});
			}
			const userData = {
				email,
				password,
				role: "patient",
				profile: {
					firstName: patientData.name?.[0]?.given?.[0] || "",
					lastName: patientData.name?.[0]?.family || "",
				},
			};

			const savedUser = await UserRepository.createUser(userData);

			const patientWithUser = {
				user: savedUser._id,
				...patientData,
			};

			const savedPatient = await PatientRepository.create(patientWithUser);

			await UserRepository.update(savedUser._id, { patient: savedPatient._id });

			const populatedPatient = await PatientRepository.findById(
				savedPatient._id
			);

			res.status(201).json({
				success: true,
				message: "Patient created successfully",
				data: populatedPatient,
			});
		} catch (error) {
			console.error("Create patient error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating patient",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const patient = await PatientRepository.update(id, updateData);

			if (!patient) {
				return res.status(404).json({
					success: false,
					message: "Patient not found",
				});
			}

			res.json({
				success: true,
				message: "Patient updated successfully",
				data: patient,
			});
		} catch (error) {
			console.error("Update patient error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating patient",
				error: error.message,
			});
		}
	}

	async delete(req, res) {
		try {
			const { id } = req.params;
			const patient = await PatientRepository.findById(id);
			if (!patient) {
				return res.status(404).json({
					success: false,
					message: "Patient not found",
				});
			}

			await PatientProcedureRepository.deleteMany({ subject: patient._id });
			await PatientAllergyRepository.deleteMany({ patient: patient._id });
			await AppointmentRepository.deleteMany({ patient: patient._id });

			await PatientRepository.delete(id);

			if (patient.user) {
				await UserRepository.delete(patient.user);
			}

			res.json({
				success: true,
				message: "Patient deleted successfully",
			});
		} catch (error) {
			console.error("Delete patient error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting patient",
				error: error.message,
			});
		}
	}

	async getProcedures(req, res) {
		try {
			const { id } = req.params;
			const { page = 1, limit = 10 } = req.query;
			const skip = (page - 1) * limit;
			const options = {
				sort: { performedDateTime: -1 },
				limit: parseInt(limit),
				skip,
			};

			const procedures = await PatientProcedureRepository.findAll(
				{ subject: id },
				options
			);
			const totalCount = await PatientProcedureRepository.count({
				subject: id,
			});

			res.json({
				success: true,
				data: procedures,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get patient procedures error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving patient procedures",
				error: error.message,
			});
		}
	}

	async addProcedure(req, res) {
		try {
			const { id } = req.params;
			const procedureData = {
				...req.body,
				subject: id,
				performer: req.userId,
			};

			const savedProcedure = await PatientProcedureRepository.create(
				procedureData
			);

			const populatedProcedure = await PatientProcedureRepository.findById(
				savedProcedure._id
			);

			res.status(201).json({
				success: true,
				message: "Procedure added successfully",
				data: populatedProcedure,
			});
		} catch (error) {
			console.error("Add procedure error:", error);
			res.status(500).json({
				success: false,
				message: "Error adding procedure",
				error: error.message,
			});
		}
	}

	async getAllergies(req, res) {
		try {
			const { id } = req.params;
			const options = {
				sort: { recordedDate: -1 },
			};

			const allergies = await PatientAllergyRepository.findAll(
				{ patient: id },
				options
			);

			res.json({
				success: true,
				data: allergies,
			});
		} catch (error) {
			console.error("Get patient allergies error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving patient allergies",
				error: error.message,
			});
		}
	}

	async addAllergy(req, res) {
		try {
			const { id } = req.params;
			const allergyData = {
				...req.body,
				patient: id,
				recorder: req.userId,
			};

			const savedAllergy = await PatientAllergyRepository.create(allergyData);

			const populatedAllergy = await PatientAllergyRepository.findById(
				savedAllergy._id
			);

			res.status(201).json({
				success: true,
				message: "Allergy added successfully",
				data: populatedAllergy,
			});
		} catch (error) {
			console.error("Add allergy error:", error);
			res.status(500).json({
				success: false,
				message: "Error adding allergy",
				error: error.message,
			});
		}
	}

	async getAppointments(req, res) {
		try {
			const { id } = req.params;
			const { status, startDate, endDate } = req.query;

			let query = { patient: id };

			if (status) {
				query.status = status;
			}

			if (startDate && endDate) {
				query.start = {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				};
			}
			const options = {
				sort: { start: -1 },
			};

			const appointments = await AppointmentRepository.findAll(query, options);

			res.json({
				success: true,
				data: appointments,
			});
		} catch (error) {
			console.error("Get patient appointments error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving patient appointments",
				error: error.message,
			});
		}
	}

	async exportToFhir(req, res) {
		try {
			const { id } = req.params;
			const patient = await PatientRepository.findById(id);
			if (!patient) {
				return res.status(404).json({
					success: false,
					message: "Patient not found",
				});
			}

			const procedures = await PatientProcedureRepository.findAll({
				subject: id,
			});
			const allergies = await PatientAllergyRepository.findAll({ patient: id });

			const fhirBundle = {
				resourceType: "Bundle",
				id: `patient-${id}-export`,
				type: "collection",
				timestamp: new Date().toISOString(),
				entry: [
					{
						resource: {
							resourceType: "Patient",
							id: patient._id.toString(),
							active: patient.active,
							name: patient.name,
							telecom: patient.telecom,
							gender: patient.gender,
							birthDate: patient.birthDate,
							address: patient.address,
							identifier: patient.identifier,
						},
					},
					...procedures.map((proc) => ({
						resource: {
							resourceType: "Procedure",
							id: proc._id.toString(),
							status: proc.status,
							code: proc.code,
							subject: {
								reference: `Patient/${patient._id}`,
							},
							performedDateTime: proc.performedDateTime,
							performer: proc.performer
								? [
										{
											actor: {
												reference: `Practitioner/${proc.performer._id}`,
											},
										},
								  ]
								: [],
						},
					})),
					...allergies.map((allergy) => ({
						resource: {
							resourceType: "AllergyIntolerance",
							id: allergy._id.toString(),
							clinicalStatus: allergy.clinicalStatus,
							verificationStatus: allergy.verificationStatus,
							code: allergy.code,
							patient: {
								reference: `Patient/${patient._id}`,
							},
							recordedDate: allergy.recordedDate,
							reaction: allergy.reaction,
						},
					})),
				],
			};

			res.json({
				success: true,
				data: fhirBundle,
			});
		} catch (error) {
			console.error("Export to FHIR error:", error);
			res.status(500).json({
				success: false,
				message: "Error exporting to FHIR",
				error: error.message,
			});
		}
	}
}

export default new PatientController();
