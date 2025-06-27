import AppointmentRepository from "../repositories/AppointmentRepository";
import DoctorRepository from "../repositories/DoctorRepository";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository";
import UserRepository from "../repositories/UserRepository";

class DoctorController {
	async getAll(req, res) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				specialty,
				active,
			} = req.query;
			const skip = (page - 1) * limit;

			let query = {};
			if (search) {
				query.$or = [
					{ "name.0.given": { $regex: search, $options: "i" } },
					{ "name.0.family": { $regex: search, $options: "i" } },
					{ "identifier.0.value": { $regex: search, $options: "i" } },
				];
			}
			if (specialty) {
				query["qualification.code.coding.code"] = specialty;
			}
			if (active !== undefined) {
				query.active = active === "true";
			}

			const doctors = await DoctorRepository.find(query);

			const totalCount = await DoctorRepository.countDocuments(query);

			res.json({
				success: true,
				data: doctors,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalCount,
					pages: Math.ceil(totalCount / limit),
				},
			});
		} catch (error) {
			console.error("Get doctors error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving doctors",
				error: error.message,
			});
		}
	}

	async getById(req, res) {
		try {
			const { id } = req.params;

			const doctor = await DoctorRepository.findById(id);

			if (!doctor) {
				return res.status(404).json({
					success: false,
					message: "Doctor not found",
				});
			}

			const appointments = await AppointmentRepository.find({
				"participant.actor": doctor._id,
			});

			const procedures = await PatientProcedureRepository.find({
				performer: doctor._id,
			});

			res.json({
				success: true,
				data: {
					doctor,
					appointments,
					procedures,
				},
			});
		} catch (error) {
			console.error("Get doctor by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving doctor",
				error: error.message,
			});
		}
	}

	async create(req, res) {
		try {
			const { email, password, ...doctorData } = req.body;

			const existingUser = await UserRepository.findOne({ email });
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "User with this email already exists",
				});
			}

			const newUser = {
				email,
				password,
				role: "doctor",
				profile: {
					firstName: doctorData.name?.[0]?.given?.[0] || "",
					lastName: doctorData.name?.[0]?.family || "",
				},
			};

			const savedUser = await UserRepository.update(existingUser._id, newUser);

			const doctor = {
				user: savedUser._id,
				...doctorData,
			};

			const savedDoctor = await DoctorRepository.create(doctor);

			savedUser.doctor = savedDoctor._id;
			await UserRepository.update(savedUser._id, savedUser);

			const populatedDoctor = await DoctorRepository.findById(savedDoctor._id);

			res.status(201).json({
				success: true,
				message: "Doctor created successfully",
				data: populatedDoctor,
			});
		} catch (error) {
			console.error("Create doctor error:", error);
			res.status(500).json({
				success: false,
				message: "Error creating doctor",
				error: error.message,
			});
		}
	}

	async update(req, res) {
		try {
			const { id } = req.params;
			const updateData = req.body;

			const doctor = await DoctorRepository.update(id, updateData, {
				new: true,
				runValidators: true,
			});

			if (!doctor) {
				return res.status(404).json({
					success: false,
					message: "Doctor not found",
				});
			}

			res.json({
				success: true,
				message: "Doctor updated successfully",
				data: doctor,
			});
		} catch (error) {
			console.error("Update doctor error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating doctor",
				error: error.message,
			});
		}
	}

	async delete(req, res) {
		try {
			const { id } = req.params;

			const doctor = await DoctorRepository.findById(id);
			if (!doctor) {
				return res.status(404).json({
					success: false,
					message: "Doctor not found",
				});
			}

			const activeAppointments = await AppointmentRepository.countDocuments({
				"participant.actor": doctor._id,
				status: { $in: ["booked", "arrived"] },
				start: { $gte: new Date() },
			});

			if (activeAppointments > 0) {
				return res.status(400).json({
					success: false,
					message: "Cannot delete doctor with active appointments",
				});
			}

			await DoctorRepository.delete(id);

			if (doctor.user) {
				await UserRepository.delete(doctor.user);
			}

			res.json({
				success: true,
				message: "Doctor deleted successfully",
			});
		} catch (error) {
			console.error("Delete doctor error:", error);
			res.status(500).json({
				success: false,
				message: "Error deleting doctor",
				error: error.message,
			});
		}
	}

	async getSchedule(req, res) {
		try {
			const { id } = req.params;
			const { startDate, endDate, status } = req.query;

			let query = { "participant.actor": id };

			if (startDate && endDate) {
				query.start = {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				};
			}

			if (status) {
				query.status = status;
			}

			const appointments = await AppointmentRepository.find(query);

			res.json({
				success: true,
				data: appointments,
			});
		} catch (error) {
			console.error("Get doctor schedule error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving doctor schedule",
				error: error.message,
			});
		}
	}

	async getPatients(req, res) {
		try {
			const { id } = req.params;

			const patientIds = await AppointmentRepository.distinct("patient", {
				"participant.actor": id,
			});

			const patients = await PatientRepositoryRepository.find({
				_id: { $in: patientIds },
			});

			const patientsWithLastAppointment = await Promise.all(
				patients.map(async (patient) => {
					const lastAppointment = await AppointmentRepository.findOne({
						patient: patient._id,
						"participant.actor": id,
					}).sort({ start: -1 });

					return {
						...patient.toObject(),
						lastAppointment: lastAppointment
							? {
									start: lastAppointment.start,
									status: lastAppointment.status,
									appointmentType: lastAppointment.appointmentType,
							  }
							: null,
					};
				})
			);

			res.json({
				success: true,
				data: patientsWithLastAppointment,
			});
		} catch (error) {
			console.error("Get doctor patients error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving doctor patients",
				error: error.message,
			});
		}
	}

	async getAvailableSlots(req, res) {
		try {
			const { id } = req.params;
			const { date } = req.query;

			if (!date) {
				return res.status(400).json({
					success: false,
					message: "Date parameter is required",
				});
			}

			const doctor = await DoctorRepository.findById(id);
			if (!doctor) {
				return res.status(404).json({
					success: false,
					message: "Doctor not found",
				});
			}

			const requestedDate = new Date(date);
			const dayOfWeek = requestedDate.getDay();
			const dayAvailability = doctor.availableTime?.find((time) =>
				time.daysOfWeek?.includes(dayOfWeek)
			);

			if (!dayAvailability) {
				return res.json({
					success: true,
					data: [],
					message: "Doctor not available on this day",
				});
			}

			const startOfDay = new Date(requestedDate);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(requestedDate);
			endOfDay.setHours(23, 59, 59, 999);

			const bookedAppointments = await AppointmentRepository.find({
				"participant.actor": id,
				start: {
					$gte: startOfDay,
					$lte: endOfDay,
				},
				status: { $in: ["booked", "arrived"] },
			});

			const availableSlots = [];
			const startTime = dayAvailability.availableStartTime || "09:00";
			const endTime = dayAvailability.availableEndTime || "17:00";
			const slotDuration = 30;
			const [startHour, startMinute] = startTime.split(":").map(Number);
			const [endHour, endMinute] = endTime.split(":").map(Number);

			for (let hour = startHour; hour < endHour; hour++) {
				for (let minute = 0; minute < 60; minute += slotDuration) {
					if (hour === endHour && minute >= endMinute) break;

					const slotStart = new Date(requestedDate);
					slotStart.setHours(hour, minute, 0, 0);

					const slotEnd = new Date(slotStart);
					slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

					const isBooked = bookedAppointments.some((appointment) => {
						const appointmentStart = new Date(appointment.start);
						const appointmentEnd = new Date(
							appointment.end || appointmentStart.getTime() + 30 * 60000
						);

						return (
							(slotStart >= appointmentStart && slotStart < appointmentEnd) ||
							(slotEnd > appointmentStart && slotEnd <= appointmentEnd)
						);
					});

					if (!isBooked && slotStart > new Date()) {
						availableSlots.push({
							start: slotStart.toISOString(),
							end: slotEnd.toISOString(),
							duration: slotDuration,
						});
					}
				}
			}

			res.json({
				success: true,
				data: availableSlots,
			});
		} catch (error) {
			console.error("Get available slots error:", error);
			res.status(500).json({
				success: false,
				message: "Error retrieving available slots",
				error: error.message,
			});
		}
	}

	async updateWorkingHours(req, res) {
		try {
			const { id } = req.params;
			const { availableTime } = req.body;

			const doctor = await DoctorRepository.update(
				id,
				{ availableTime },
				{ new: true, runValidators: true }
			);

			if (!doctor) {
				return res.status(404).json({
					success: false,
					message: "Doctor not found",
				});
			}

			res.json({
				success: true,
				message: "Working hours updated successfully",
				data: doctor,
			});
		} catch (error) {
			console.error("Update working hours error:", error);
			res.status(500).json({
				success: false,
				message: "Error updating working hours",
				error: error.message,
			});
		}
	}
}

export default new DoctorController();
