import { ObjectId } from "mongodb";
import DoctorRepository from "../repositories/DoctorRepository.js";
import InterventionRepository from "../repositories/InterventionRepository.js";
import InterventionTypeRepository from "../repositories/InterventionTypeRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

class InterventionService {
	async getAllInterventions(query = {}, options = {}) {
		try {
			const interventions = await InterventionRepository.findAll(query, {
				...options,
				populate: "interventionType patient doctor",
			});
			const count = await InterventionRepository.count(query);

			return {
				count,
				interventions,
			};
		} catch (error) {
			throw error;
		}
	}

	async getInterventionById(id) {
		try {
			const intervention = await InterventionRepository.findById(
				id,
				"interventionType patient doctor"
			);

			if (!intervention) {
				throw new Error("Intervention not found");
			}
			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async getPatientInterventions(patientId, options = {}) {
		try {
			const patient = await PatientRepository.findById(patientId);

			if (!patient) {
				throw new Error("Patient not found");
			}

			const interventions = await InterventionRepository.findByPatient(
				patientId,
				{
					...options,
					populate: "interventionType doctor",
				}
			);
			const count = await InterventionRepository.count({ patient: patientId });

			return {
				count,
				interventions,
			};
		} catch (error) {
			throw error;
		}
	}

	async getDoctorInterventions(doctorId, options = {}) {
		try {
			const doctor = await DoctorRepository.findById(doctorId);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			const interventions = await InterventionRepository.findByDoctor(
				doctorId,
				options
			);
			const count = await InterventionRepository.count({ doctor: doctorId });

			return {
				count,
				interventions,
			};
		} catch (error) {
			throw error;
		}
	}

	async createIntervention(interventionData) {
		try {
			const patient = await PatientRepository.findById(
				interventionData.patient
			);

			if (!patient) {
				throw new Error("Patient not found");
			}

			const interventionType = await InterventionTypeRepository.findById(
				interventionData.interventionType
			);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			const doctor = await DoctorRepository.findById(interventionData.doctor);

			if (!doctor) {
				throw new Error("Doctor not found");
			}

			if (interventionData.date) {
				if (!doctor) {
					throw new Error("Doctor record not found");
				}

				const isAvailable = await DoctorRepository.isAvailable(
					doctor._id.toString(),
					interventionData.date
				);

				if (!isAvailable) {
					throw new Error("Doctor is not available at the requested time");
				}

				const dateTime = new Date(interventionData.date);
				const appointmentEndDateTime = new Date(dateTime);

				appointmentEndDateTime.setMinutes(
					appointmentEndDateTime.getMinutes() +
						(interventionType.duration || 30)
				);

				const endTimeString = appointmentEndDateTime.toISOString();

				const existingAppointment = await InterventionRepository.findOne({
					doctorId: interventionData.doctor,
					date: {
						$gt: interventionData.date,
						$lt: endTimeString,
					},
				});

				if (existingAppointment) {
					throw new Error(
						"This appointment would overlap with another appointment"
					);
				}
			}

			interventionData.doctor = doctor._id;
			const intervention = await InterventionRepository.create(
				interventionData
			);

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async updateIntervention(id, interventionData) {
		try {
			const existingIntervention = await InterventionRepository.findById(id);

			if (!existingIntervention) {
				throw new Error("Intervention not found");
			}

			if (
				interventionData.date &&
				interventionData.date !== existingIntervention.date
			) {
				const doctorId = interventionData.doctor || existingIntervention.doctor;
				const doctorRecord = await DoctorRepository.findByUserId(doctorId);

				if (!doctorRecord) {
					throw new Error("Doctor record not found");
				}

				const isAvailable = await DoctorRepository.isAvailable(
					doctorRecord._id.toString(),
					interventionData.date
				);

				if (!isAvailable) {
					throw new Error("Doctor is not available at the requested time");
				}

				const interventionTypeId =
					interventionData.interventionType ||
					existingIntervention.interventionType;
				const interventionType = await InterventionTypeRepository.findById(
					interventionTypeId
				);

				if (!interventionType) {
					throw new Error("Intervention type not found");
				}

				const dateTime = new Date(interventionData.date);
				const appointmentEndDateTime = new Date(dateTime);

				appointmentEndDateTime.setMinutes(
					appointmentEndDateTime.getMinutes() +
						(interventionType.duration || 30)
				);

				const endTimeString = appointmentEndDateTime.toISOString();

				const existingAppointment = await InterventionRepository.findOne({
					_id: { $ne: id },
					doctor: doctorId,
					date: {
						$gt: interventionData.date,
						$lt: endTimeString,
					},
				});

				if (existingAppointment) {
					throw new Error(
						"This appointment would overlap with another appointment"
					);
				}
			}

			const intervention = await InterventionRepository.update(
				id,
				interventionData
			);

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async updateInterventionState(id, state) {
		try {
			const existingIntervention = await InterventionRepository.findById(id);

			if (!existingIntervention) {
				throw new Error("Intervention not found");
			}

			const intervention = await InterventionRepository.updateState(id, state);

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async deleteIntervention(id) {
		try {
			const intervention = await InterventionRepository.delete(id);

			if (!intervention) {
				throw new Error("Intervention not found");
			}

			return {};
		} catch (error) {
			throw error;
		}
	}

	async getAvailableAppointmentSlots(doctorId, date, interventionTypeId) {
		try {
			const doctorRecord = await DoctorRepository.findById(doctorId);

			if (!doctorRecord) {
				throw new Error("Doctor record not found");
			}

			const interventionType = await InterventionTypeRepository.findById(
				interventionTypeId
			);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			const timeSlots = await DoctorRepository.getAvailableTimeSlots(
				doctorRecord._id.toString(),
				date
			);

			return {
				date,
				interventionType: interventionType.name,
				duration: interventionType.duration,
				availableSlots: timeSlots,
			};
		} catch (error) {
			throw error;
		}
	}

	async checkDoctorAvailability(doctorId, dateTime, interventionTypeId) {
		try {
			const doctorRecord = await DoctorRepository.findById(doctorId);

			if (!doctorRecord) {
				throw new Error("Doctor record not found");
			}

			const interventionType = await InterventionTypeRepository.findById(
				interventionTypeId
			);

			if (!interventionType) {
				throw new Error("Intervention type not found");
			}

			const isAvailable = await DoctorRepository.isAvailable(
				doctorRecord._id.toString(),
				dateTime
			);

			if (!isAvailable) {
				return false;
			}

			const appointmentDateTime = new Date(dateTime);
			const appointmentEndDateTime = new Date(appointmentDateTime);

			appointmentEndDateTime.setMinutes(
				appointmentEndDateTime.getMinutes() + (interventionType.duration || 30)
			);

			const existingAppointment = await InterventionRepository.findOne({
				doctor: doctorId,
				date: {
					$gt: appointmentDateTime.toISOString(),
					$lt: appointmentEndDateTime.toISOString(),
				},
				state: { $nin: ["canceled"] },
			});

			return !existingAppointment;
		} catch (error) {
			throw error;
		}
	}

	async scheduleAppointment(appointmentData) {
		try {
			if (
				!appointmentData.patient ||
				!appointmentData.doctor ||
				!appointmentData.interventionType ||
				!appointmentData.date
			) {
				throw new Error(
					"Patient, doctor, intervention type, and appointment date are required"
				);
			}

			const intervention = await this.createIntervention({
				...appointmentData,
				state: "scheduled",
			});

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async rescheduleAppointment(id, newdate) {
		try {
			const existingIntervention = await this.getInterventionById(id);

			if (!existingIntervention) {
				throw new Error("Appointment not found");
			}

			const intervention = await this.updateIntervention(id, {
				date: newdate,
			});

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async cancelAppointment(id) {
		try {
			const existingIntervention = await this.getInterventionById(id);

			if (!existingIntervention) {
				throw new Error("Appointment not found");
			}

			const intervention = await this.updateInterventionState(id, "canceled");

			return intervention;
		} catch (error) {
			throw error;
		}
	}

	async getDoctorAppointments(doctorId, options = {}, status = "all") {
		try {
			const doctor = await DoctorRepository.findById(doctorId);
			if (!doctor) {
				throw new Error("Doctor not found");
			}

			const query = {
				doctor: doctor._id,
				date: { $exists: true },
			};

			if (status === "upcoming") {
				query.state = { $nin: ["completed", "canceled"] };
			} else if (status === "past") {
				query.state = "completed";
			}

			const interventions = await InterventionRepository.findAll(query, {
				...options,
				populate: "interventionType patient",
				sort: { date: 1 },
			});

			const count = await InterventionRepository.count(query);

			return {
				count,
				appointments: interventions,
			};
		} catch (error) {
			throw error;
		}
	}

	async getPatientAppointments(patientId, options = {}, status = "all") {
		try {
			const patient = await PatientRepository.findById(patientId);

			if (!patient) {
				throw new Error("Patient not found");
			}

			const query = {
				patient: new ObjectId(patientId),
				date: { $exists: true },
			};

			if (status === "upcoming") {
				query.state = { $nin: ["completed", "canceled"] };
			} else if (status === "past") {
				query.state = "completed";
			}

			const interventions = await InterventionRepository.findAll(query, {
				...options,
				populate: "interventionType doctor",
				sort: { date: 1 },
			});

			const count = await InterventionRepository.count(query);

			return {
				count,
				appointments: interventions,
			};
		} catch (error) {
			throw error;
		}
	}

	async findPatientsWithAppointments(
		doctorId,
		search = {},
		appointmentType = "all",
		options = {}
	) {
		try {
			const doctor = await UserRepository.findById(doctorId);

			if (!doctor || doctor.role !== "doctor") {
				throw new Error("Doctor not found");
			}

			const query = { doctor: doctor._id, date: { $exists: true } };

			const now = new Date();

			if (appointmentType === "upcoming") {
				query.state = { $nin: ["completed", "canceled"] };
			} else if (appointmentType === "past") {
				query.state = "completed";
			}

			const interventions = await InterventionRepository.findAll(query, {
				populate: "patient",
			});

			const patientIds = [
				...new Set(
					interventions
						.map((i) => (i.patient ? i.patient : null))
						.filter((id) => id !== null)
				),
			];

			if (patientIds.length === 0) {
				return { count: 0, patients: [] };
			}

			const patientQuery = { _id: { $in: patientIds } };

			if (search.name && search.name !== "") {
				patientQuery.$or = [
					{ name: { $regex: search.name, $options: "i" } },
					{ surname: { $regex: search.name, $options: "i" } },
				];
			}
			if (search.email && search.email !== "") {
				patientQuery.email = { $regex: search.email, $options: "i" };
			}

			if (search.telephone && search.telephone !== "") {
				patientQuery.telephone = { $regex: search.telephone, $options: "i" };
			}
			options.page = options.page <= 0 ? 1 : options.page;

			const patients = await PatientRepository.findAll(patientQuery, options);
			const count = patients.length;

			return {
				count,
				patients,
			};
		} catch (error) {
			throw error;
		}
	}
}

export default new InterventionService();
