import DoctorRepository from "../repositories/DoctorRepository.js";
import InterventionService from "../services/InterventionService.js";

class InterventionController {
	async getInterventions(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "-date";
		const state = req.query.state || "";
		const doctor = req.query.doctor || "";

		const query = {};
		if (state) {
			query.state = state;
		}
		if (doctor) {
			query.doctor = doctor;
		}

		const options = { sort };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const result = await InterventionService.getAllInterventions(
				query,
				options
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getIntervention(req, res) {
		try {
			const intervention = await InterventionService.getInterventionById(
				req.params.id
			);

			if (
				req.user.role === "patient" &&
				req.user.patientId !== intervention.patient._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view this intervention" });
			}

			if (
				req.user.role === "doctor" &&
				req.user._id !== intervention.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view this intervention" });
			}

			res.status(200).json(intervention);
		} catch (error) {
			res.status(404).json({ error: error.message });
		}
	}

	async getPatientInterventions(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "-date";

		const options = { sort };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId.toString() !== req.params.patientId
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these interventions" });
			}

			const result = await InterventionService.getPatientInterventions(
				req.params.patientId,
				options
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getDoctorInterventions(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "-date";

		const options = { sort };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const doctor = await DoctorRepository.findByUserId(req.params.doctorId);
			const userDoctor = await DoctorRepository.findById(req.params.doctorId);
			if (
				req.user.role !== "admin" &&
				(req.user.role !== "doctor" ||
					(req.user._id.toString() !== doctor?.userId.toString() &&
						req.user._id.toString() !== userDoctor?.userId.toString()))
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these patients" });
			}

			const result = await InterventionService.getDoctorInterventions(
				doctor?._id || userDoctor?._id,
				options
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async createIntervention(req, res) {
		if (req.user.role === "doctor") {
			req.body.doctor = req.user._id;
		}

		try {
			const intervention = await InterventionService.createIntervention(
				req.body
			);
			res.status(201).json(intervention);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateIntervention(req, res) {
		try {
			const intervention = await InterventionService.getInterventionById(
				req.params.id
			);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== intervention.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to update this intervention" });
			}

			const updatedIntervention = await InterventionService.updateIntervention(
				req.params.id,
				req.body
			);
			res.status(200).json(updatedIntervention);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateInterventionState(req, res) {
		try {
			const intervention = await InterventionService.getInterventionById(
				req.params.id
			);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== intervention.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to update this intervention" });
			}

			const updatedIntervention =
				await InterventionService.updateInterventionState(
					req.params.id,
					req.body.state
				);
			res.status(200).json(updatedIntervention);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async deleteIntervention(req, res) {
		try {
			if (req.user.role === "doctor") {
				const intervention = await InterventionService.getInterventionById(
					req.params.id
				);

				if (req.user._id.toString() !== intervention.doctor._id.toString()) {
					return res
						.status(403)
						.json({ error: "Not authorized to delete this intervention" });
				}
			}

			await InterventionService.deleteIntervention(req.params.id);
			res.status(200).json({});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getAvailableAppointmentSlots(req, res) {
		try {
			const { doctorId, date, interventionTypeId } = req.query;
			if (!doctorId || !date || !interventionTypeId) {
				return res.status(400).json({
					error: "Doctor ID, date, and intervention type ID are required",
				});
			}

			const slots = await InterventionService.getAvailableAppointmentSlots(
				doctorId,
				date,
				interventionTypeId
			);

			res.status(200).json(slots);
		} catch (error) {
			console.error("Error fetching available appointment slots:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async checkDoctorAvailability(req, res) {
		try {
			const { doctorId, dateTime, interventionTypeId } = req.query;

			if (!doctorId || !dateTime || !interventionTypeId) {
				return res.status(400).json({
					error: "Doctor ID, date/time, and intervention type ID are required",
				});
			}

			const isAvailable = await InterventionService.checkDoctorAvailability(
				doctorId,
				dateTime,
				interventionTypeId
			);

			res.status(200).json({ isAvailable });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async scheduleAppointment(req, res) {
		try {
			if (req.user.role === "patient") {
				req.body.patient = req.user.patientId;
			}

			const appointment = await InterventionService.scheduleAppointment(
				req.body
			);
			res.status(201).json(appointment);
		} catch (error) {
			console.error("Error scheduling appointment:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async rescheduleAppointment(req, res) {
		try {
			const intervention = await InterventionService.getInterventionById(
				req.params.id
			);

			if (
				req.user.role === "patient" &&
				req.user.patientId !== intervention.patient._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to reschedule this appointment" });
			}

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== intervention.doctor._id.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to reschedule this appointment" });
			}

			const updatedAppointment =
				await InterventionService.rescheduleAppointment(
					req.params.id,
					req.body.appointmentDate
				);

			res.status(200).json(updatedAppointment);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async cancelAppointment(req, res) {
		try {
			const intervention = await InterventionService.getInterventionById(
				req.params.id
			);

			if (
				req.user.role === "patient" &&
				req.user.patientId.toString() !== intervention.patient.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to cancel this appointment" });
			}

			if (
				req.user.role === "doctor" &&
				req.user.doctorId.toString() !== intervention.doctor.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to cancel this appointment" });
			}

			await InterventionService.cancelAppointment(req.params.id);
			res.status(200).json({});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getDoctorAppointments(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const status = req.query.status || "all";

		const options = {};

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const doctor = await DoctorRepository.findByUserId(req.params.doctorId);
			const userDoctor = await DoctorRepository.findById(req.params.doctorId);
			if (
				req.user.role !== "admin" &&
				(req.user.role !== "doctor" ||
					(req.user._id.toString() !== doctor?.userId.toString() &&
						req.user._id.toString() !== userDoctor?.userId.toString()))
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these patients" });
			}

			const result = await InterventionService.getDoctorAppointments(
				doctor?._id || userDoctor?._id,
				options,
				status
			);

			res.status(200).json(result);
		} catch (error) {
			console.error("Error fetching doctor appointments:", error);
			res.status(400).json({ error: error.message });
		}
	}

	async getPatientAppointments(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const status = req.query.status || "all";

		const options = {};

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId.toString() !== req.params.patientId
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these appointments" });
			}

			const result = await InterventionService.getPatientAppointments(
				req.params.patientId,
				options,
				status
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPatientPastAppointments(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

		const options = {};

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId !== req.params.patientId
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these appointments" });
			}

			const result = await InterventionService.getPatientAppointments(
				req.params.patientId,
				options,
				"past"
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPatientUpcomingAppointments(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

		const options = {};

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			if (
				req.user.role === "patient" &&
				req.user.patientId !== req.params.patientId
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these appointments" });
			}

			const result = await InterventionService.getPatientAppointments(
				req.params.patientId,
				options,
				"upcoming"
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getDoctorPatients(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const appointmentType = req.query.appointmentType || "all";

		const search = {};
		if (req.query.name) search.name = req.query.name;
		if (req.query.email) search.email = req.query.email;
		if (req.query.phone) search.phone = req.query.phone;

		const options = {};

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== req.params.doctorId
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these patients" });
			}

			const result = await InterventionService.findPatientsWithAppointments(
				req.params.doctorId,
				search,
				appointmentType,
				options
			);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

export default new InterventionController();
