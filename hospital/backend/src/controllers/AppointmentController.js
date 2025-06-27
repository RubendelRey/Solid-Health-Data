import { ObjectId } from "mongodb";
import AppointmentRepository from "../repositories/AppointmentRepository";
import DoctorRepository from "../repositories/DoctorRepository";
import PatientRepository from "../repositories/PatientRepository";

class AppointmentController {
	async getAll(req, res) {
		try {
			const {
				page = 1,
				limit = 10,
				status,
				doctorId,
				patientId,
				startDate,
				endDate,
			} = req.query;
			const skip = (page - 1) * limit;

			let query = {};

			if (req.user.role === "doctor") {
				const doctor = await DoctorRepository.findOne({ user: req.userId });
				if (doctor) {
					query["participant.actor"] = doctor._id;
				}
			} else if (req.user.role === "patient") {
				const patient = await PatientRepository.findOne({ user: req.userId });
				if (patient) {
					query.patient = patient._id;
				}
			}

			if (status) {
				query.status = status;
			}
			if (doctorId) {
				query["participant.actor"] = doctorId;
			}
			if (patientId) {
				query.patient = patientId;
			}
			if (startDate && endDate) {
				query.start = {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				};
			}

			const appointments = await AppointmentRepository.find(query);

			const totalCount = await AppointmentRepository.countDocuments(query);

			res.json({
				success: true,
				data: appointments,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get appointments error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving appointments",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;

			const appointment = await AppointmentRepository.findById(id);

			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			const hasAccess = await this.checkAppointmentAccess(
				appointment,
				req.userId,
				req.user.role
			);
			if (!hasAccess) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}

			res.json({
				success: true,
				data: appointment,
			});
		} catch (error) {
			console.error("Get appointment by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving appointment",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			const appointmentData = req.body;

			if (req.user.role === "patient") {
				const patient = await PatientRepository.findOne({ user: req.userId });
				if (patient) {
					appointmentData.patient = patient._id;
				}
			}

			const doctorId = appointmentData.participant?.[0]?.actor;
			if (doctorId) {
				const isAvailable = await this.checkDoctorAvailability(
					doctorId,
					new Date(appointmentData.start),
					new Date(
						appointmentData.end ||
							new Date(new Date(appointmentData.start).getTime() + 30 * 60000)
					)
				);

				if (!isAvailable) {
					return res.status(400).json({
						success: false,
						message: "Doctor is not available at the requested time",
					});
				}
			}

			const appointment = new Appointment(appointmentData);
			const savedAppointment = await AppointmentRepository.save();

			const populatedAppointment = await AppointmentRepository.findById(
				savedAppointmentRepository._id
			);

			res.status(201).json({
				success: true,
				message: "Appointment created successfully",
				data: populatedAppointment,
			});
		} catch (error) {
			console.error("Create appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating appointment",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			const { id } = req.params;
			const updateData = req.body;

			const appointment = await AppointmentRepository.findById(id);
			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			const hasAccess = await this.checkAppointmentAccess(
				appointment,
				req.userId,
				req.user.role
			);
			if (!hasAccess) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}

			if (updateData.start || updateData.end) {
				const doctorId = AppointmentRepository.participant?.[0]?.actor;
				if (doctorId) {
					const startTime = new Date(
						updateData.start || AppointmentRepository.start
					);
					const endTime = new Date(
						updateData.end ||
							AppointmentRepository.end ||
							new Date(startTime.getTime() + 30 * 60000)
					);

					const isAvailable = await this.checkDoctorAvailability(
						doctorId,
						startTime,
						endTime,
						id
					);

					if (!isAvailable) {
						return res.status(400).json({
							success: false,
							message: "Doctor is not available at the requested time",
						});
					}
				}
			}

			const updatedAppointment = await AppointmentRepository.update(
				id,
				updateData,
				{
					new: true,
					runValidators: true,
				}
			);

			res.json({
				success: true,
				message: "Appointment updated successfully",
				data: updatedAppointment,
			});
		} catch (error) {
			console.error("Update appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating appointment",
				error: error.message,
			});
		}
	}

	async cancel(req, res) {
		try {
			const { id } = req.params;
			const { reason } = req.body;

			const appointment = await AppointmentRepository.findById(id);
			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			const hasAccess = await this.checkAppointmentAccess(
				appointment,
				req.userId,
				req.user.role
			);
			if (!hasAccess) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}

			const updatedAppointment = await AppointmentRepository.update(
				id,
				{
					status: "cancelled",
					cancelationReason: reason,
					meta: {
						...AppointmentRepository.meta,
						lastUpdated: new Date(),
					},
				},
				{ new: true }
			);

			res.json({
				success: true,
				message: "Appointment cancelled successfully",
				data: updatedAppointment,
			});
		} catch (error) {
			console.error("Cancel appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error cancelling appointment",
				error: error.message,
			});
		}
	}

	async confirm(req, res) {
		try {
			const { id } = req.params;

			const appointment = await AppointmentRepository.findById(id);
			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			const updatedAppointment = await AppointmentRepository.update(
				id,
				{
					status: "booked",
					meta: {
						...AppointmentRepository.meta,
						lastUpdated: new Date(),
					},
				},
				{ new: true }
			);

			res.json({
				success: true,
				message: "Appointment confirmed successfully",
				data: updatedAppointment,
			});
		} catch (error) {
			console.error("Confirm appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error confirming appointment",
				error: error.message,
			});
		}
	}

	async complete(req, res) {
		try {
			const { id } = req.params;
			const { notes } = req.body;

			const appointment = await AppointmentRepository.findById(id);
			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			if (req.user.role !== "doctor" && req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only doctors can complete appointments",
				});
			}

			const updatedAppointment = await AppointmentRepository.update(
				id,
				{
					status: "fulfilled",
					note: notes
						? [
								...(AppointmentRepository.note || []),
								{ text: notes, time: new Date() },
						  ]
						: AppointmentRepository.note,
					meta: {
						...AppointmentRepository.meta,
						lastUpdated: new Date(),
					},
				},
				{ new: true }
			);

			res.json({
				success: true,
				message: "Appointment completed successfully",
				data: updatedAppointment,
			});
		} catch (error) {
			console.error("Complete appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error completing appointment",
				error: error.message,
			});
		}
	}

	async checkAppointmentAccess(appointment, userId, userRole) {
		try {
			if (userRole === "administrator") {
				return true;
			}

			if (userRole === "doctor") {
				const doctor = await DoctorRepository.findOne({ user: userId });
				return (
					doctor &&
					AppointmentRepository.participant?.some(
						(p) => p.actor?.toString() === doctor._id.toString()
					)
				);
			}

			if (userRole === "patient") {
				const patient = await PatientRepository.findOne({ user: userId });
				return (
					patient &&
					AppointmentRepository.patient?.toString() === patient._id.toString()
				);
			}

			return false;
		} catch (error) {
			console.error("Check appointment access error:", error);
			return false;
		}
	}

	async checkDoctorAvailability(
		doctorId,
		startTime,
		endTime,
		excludeAppointmentId = null
	) {
		try {
			const query = {
				"participant.actor": new ObjectId(doctorId),
				status: { $in: ["booked", "arrived"] },
				$or: [
					{
						start: { $lte: startTime },
						end: { $gt: startTime },
					},
					{
						start: { $lt: endTime },
						end: { $gte: endTime },
					},
					{
						start: { $gte: startTime },
						end: { $lte: endTime },
					},
				],
			};

			if (excludeAppointmentId) {
				query._id = { $ne: excludeAppointmentId };
			}

			const conflictingAppointments =
				await AppointmentRepository.countDocuments(query);
			return conflictingAppointments === 0;
		} catch (error) {
			console.error("Check doctor availability error:", error);
			return false;
		}
	}

	async delete(req, res) {
		try {
			const { id } = req.params;

			const appointment = await AppointmentRepository.findById(id);
			if (!appointment) {
				return res.status(404).json({
					success: false,
					message: "Appointment not found",
				});
			}

			if (req.user.role !== "administrator") {
				return res.status(403).json({
					success: false,
					message: "Only administrators can delete appointments",
				});
			}

			await AppointmentRepository.delete(id);

			res.json({
				success: true,
				message: "Appointment deleted successfully",
			});
		} catch (error) {
			console.error("Delete appointment error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting appointment",
				error: error.message,
			});
		}
	}
}

export default new AppointmentController();
