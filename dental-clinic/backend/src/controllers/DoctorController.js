import DoctorRepository from "../repositories/DoctorRepository.js";
import DoctorService from "../services/DoctorService.js";

class DoctorController {
	async getDoctors(req, res) {
		const page = req.query.page ? parseInt(req.query.page, 10) : null;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
		const sort = req.query.sort || "name";
		const specialty = req.query.specialty || "";

		const query = {};
		if (specialty) {
			query.specialties = specialty;
		}

		const options = { sort };

		if (page !== null && limit !== null) {
			options.page = page;
			options.limit = limit;
		}

		try {
			const result = await DoctorService.getAllDoctors(query, options);

			res.status(200).json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getDoctor(req, res) {
		try {
			const doctor = await DoctorService.getDoctorById(req.params.id);
			res.status(200).json(doctor);
		} catch (error) {
			res.status(404).json({ error: error.message });
		}
	}

	async getDoctorByUserId(req, res) {
		try {
			if (req.user.role === "doctor" && req.user._id !== req.params.userId) {
				return res
					.status(403)
					.json({ error: "Not authorized to view this doctor profile" });
			}

			const doctor = await DoctorService.getDoctorByUserId(req.params.userId);
			res.status(200).json(doctor);
		} catch (error) {
			res.status(404).json({ error: error.message });
		}
	}

	async createDoctor(req, res) {
		try {
			if (req.user.role === "doctor") {
				req.body.userId = req.user._id;
			}

			const doctor = await DoctorService.createDoctor(req.body);
			res.status(201).json(doctor);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateDoctor(req, res) {
		try {
			const doctor = await DoctorService.getDoctorById(req.params.id);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== doctor.userId.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to update this doctor profile" });
			}

			const updatedDoctor = await DoctorService.updateDoctor(
				req.params.id,
				req.body
			);
			res.status(200).json(updatedDoctor);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async deleteDoctor(req, res) {
		try {
			await DoctorService.deleteDoctor(req.params.id);
			res.status(200).json({});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateWorkHours(req, res) {
		try {
			const doctor = await DoctorService.getDoctorById(req.params.id);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== doctor.userId.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to update this doctor profile" });
			}

			const updatedDoctor = await DoctorService.updateWorkHours(
				req.params.id,
				req.body.workHours
			);
			res.status(200).json(updatedDoctor);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getAvailableTimeSlots(req, res) {
		try {
			const { date } = req.query;

			if (!date) {
				return res.status(400).json({ error: "Date is required" });
			}

			const slots = await DoctorService.getAvailableTimeSlots(
				req.params.id,
				date
			);
			res.status(200).json({ date, availableSlots: slots });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getAvailableDoctors(req, res) {
		try {
			const { date, timeSlot } = req.query;

			if (!date || !timeSlot) {
				return res
					.status(400)
					.json({ error: "Date and time slot are required" });
			}

			const doctors = await DoctorService.getAvailableDoctors(date, timeSlot);
			res.status(200).json({ count: doctors.length, doctors });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getDoctorPatients(req, res) {
		try {
			const doctor = await DoctorRepository.findByUserId(req.params.id);
			const userDoctor = await DoctorRepository.findById(req.params.id);
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

			let id = doctor?.userId || userDoctor?.userId;
			const patients = await DoctorService.getDoctorPatients(id.toString());
			res.status(200).json(patients);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getFutureAppointments(req, res) {
		try {
			const doctor = await DoctorService.getDoctorById(req.params.id);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== doctor.userId.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these appointments" });
			}

			const appointments = await DoctorService.getFutureAppointments(
				doctor.userId
			);
			res.status(200).json({ count: appointments.length, appointments });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	async getPastAppointments(req, res) {
		try {
			const doctor = await DoctorService.getDoctorById(req.params.id);

			if (
				req.user.role === "doctor" &&
				req.user._id.toString() !== doctor.userId.toString()
			) {
				return res
					.status(403)
					.json({ error: "Not authorized to view these appointments" });
			}

			const appointments = await DoctorService.getPastAppointments(
				doctor.userId
			);
			res.status(200).json({ count: appointments.length, appointments });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

export default new DoctorController();
