const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const PatientProcedure = require("../models/PatientProcedure");
const PatientAllergy = require("../models/PatientAllergy");
const {
	default: PatientRepository,
} = require("../repositories/PatientRepository");
const {
	default: DoctorRepository,
} = require("../repositories/DoctorRepository");
const { default: UserRepository } = require("../repositories/UserRepository");
const {
	default: AppointmentRepository,
} = require("../repositories/AppointmentRepository");
const {
	default: PatientProcedureRepository,
} = require("../repositories/PatientProcedureRepository");
const {
	default: PatientAllergyRepository,
} = require("../repositories/PatientAllergyRepository");

class StatsController {
	async getDashboard(req, res) {
		try {
			const userRole = req.user.role;
			const userId = req.user.userId;

			let dashboardData = {};
			switch (userRole) {
				case "administrator":
					dashboardData = await this.getAdminStats();
					break;
				case "doctor":
					dashboardData = await this.getDoctorStats(userId);
					break;
				case "patient":
					dashboardData = await this.getPatientStats(userId);
					break;
				default:
					dashboardData = { message: "No data available for this role" };
			}

			res.json({
				success: true,
				data: dashboardData,
			});
		} catch (error) {
			console.error("Dashboard stats error:", error);
			res.status(500).json({
				success: false,
				message: "Server error while fetching dashboard data",
			});
		}
	}

	async getAdminStats() {
		try {
			const now = new Date();
			const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const firstDayOfLastMonth = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1
			);
			const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			const totalPatients = await PatientRepository.countDocuments();
			const totalDoctors = await DoctorRepository.countDocuments();
			const totalUsers = await UserRepository.countDocuments();

			const newPatientsThisMonth = await PatientRepository.countDocuments({
				createdAt: { $gte: firstDayOfMonth },
			});

			const newUsersThisMonth = await UserRepository.countDocuments({
				createdAt: { $gte: firstDayOfMonth },
			});

			const newPatientsLastMonth = await PatientRepository.countDocuments({
				createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
			});

			const appointmentsToday = await AppointmentRepository.countDocuments({
				appointmentDate: {
					$gte: today,
					$lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
				},
			});

			const pendingAppointments = await AppointmentRepository.countDocuments({
				status: "Scheduled",
				appointmentDate: { $gte: now },
			});

			const totalProcedures = await PatientProcedureRepository.countDocuments();
			const proceduresThisMonth =
				await PatientProcedureRepository.countDocuments({
					createdAt: { $gte: firstDayOfMonth },
				});

			const activeDoctors = await DoctorRepositoryRepository.countDocuments({
				isActive: true,
			});

			const patientsTrend =
				newPatientsLastMonth > 0
					? Math.round(
							((newPatientsThisMonth - newPatientsLastMonth) /
								newPatientsLastMonth) *
								100
					  )
					: newPatientsThisMonth > 0
					? 100
					: 0;

			return {
				totalPatients,
				totalDoctors,
				totalUsers,
				newPatientsThisMonth,
				newUsersThisMonth,
				appointmentsToday,
				pendingAppointments,
				totalProcedures,
				proceduresThisMonth,
				activeDoctors,
				patientsTrend,
			};
		} catch (error) {
			console.error("Admin stats error:", error);
			throw error;
		}
	}

	async getDoctorStats(userId) {
		try {
			const doctor = await DoctorRepository.findOne({ userId });
			if (!doctor) {
				return { error: "Doctor profile not found" };
			}

			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const firstDayOfWeek = new Date(
				now.getTime() - now.getDay() * 24 * 60 * 60 * 1000
			);

			const myPatients = await PatientRepository.countDocuments({
				assignedDoctor: doctor._id,
			});

			const todaysAppointments = await AppointmentRepository.countDocuments({
				doctorId: doctor._id,
				appointmentDate: {
					$gte: today,
					$lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
				},
			});

			const completedToday = await AppointmentRepository.countDocuments({
				doctorId: doctor._id,
				status: "Completed",
				appointmentDate: {
					$gte: today,
					$lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
				},
			});

			const proceduresThisMonth =
				await PatientProcedureRepository.countDocuments({
					doctorId: doctor._id,
					createdAt: { $gte: firstDayOfMonth },
				});

			const newPatientsThisWeek = await PatientRepository.countDocuments({
				assignedDoctor: doctor._id,
				createdAt: { $gte: firstDayOfWeek },
			});

			const satisfactionRate = 95;

			return {
				myPatients,
				todaysAppointments,
				completedToday,
				proceduresThisMonth,
				newPatientsThisWeek,
				satisfactionRate,
			};
		} catch (error) {
			console.error("Doctor stats error:", error);
			throw error;
		}
	}

	async getPatientStats(userId) {
		try {
			const patient = await PatientRepository.findOne({ userId });
			if (!patient) {
				return { error: "Patient profile not found" };
			}

			const now = new Date();

			const nextAppointment = await AppointmentRepository.findOne({
				patientId: patient._id,
				appointmentDate: { $gte: now },
				status: { $in: ["Scheduled", "Confirmed"] },
			}).sort({ appointmentDate: 1 });

			const myProcedures = await PatientProcedureRepository.countDocuments({
				patientId: patient._id,
			});

			const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
			const recentProcedures = await PatientProcedureRepository.countDocuments({
				patientId: patient._id,
				createdAt: { $gte: threeMonthsAgo },
			});

			const myAllergies = await PatientAllergyRepository.countDocuments({
				patientId: patient._id,
			});

			const healthScore = 85;

			return {
				nextAppointment: nextAppointment ? "Scheduled" : "None",
				nextAppointmentDate: nextAppointment
					? nextAppointment.appointmentDate.toLocaleDateString()
					: "No upcoming appointments",
				myProcedures,
				recentProcedures,
				myAllergies,
				healthScore,
			};
		} catch (error) {
			console.error("Patient stats error:", error);
			throw error;
		}
	}

	async getPatientStats(req, res) {
		try {
			const totalPatients = await PatientRepository.countDocuments();
			const activePatients = await PatientRepository.countDocuments({
				isActive: true,
			});
			const inactivePatients = totalPatients - activePatients;

			const patients = await PatientRepository.find({}, "dateOfBirth");
			const ageGroups = {
				"0-18": 0,
				"19-35": 0,
				"36-50": 0,
				"51-65": 0,
				"65+": 0,
			};

			patients.forEach((patient) => {
				const age = Math.floor(
					(Date.now() - patient.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000)
				);
				if (age <= 18) ageGroups["0-18"]++;
				else if (age <= 35) ageGroups["19-35"]++;
				else if (age <= 50) ageGroups["36-50"]++;
				else if (age <= 65) ageGroups["51-65"]++;
				else ageGroups["65+"]++;
			});

			res.json({
				success: true,
				data: {
					totalPatients,
					activePatients,
					inactivePatients,
					ageGroups,
				},
			});
		} catch (error) {
			console.error("Patient stats error:", error);
			res.status(500).json({
				success: false,
				message: "Server error while fetching patient statistics",
			});
		}
	}

	async getAppointmentStats(req, res) {
		try {
			const { startDate, endDate } = req.query;

			let dateFilter = {};
			if (startDate && endDate) {
				dateFilter = {
					appointmentDate: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				};
			}

			const totalAppointments = await AppointmentRepository.countDocuments(
				dateFilter
			);
			const completedAppointments = await AppointmentRepository.countDocuments({
				...dateFilter,
				status: "Completed",
			});
			const cancelledAppointments = await AppointmentRepository.countDocuments({
				...dateFilter,
				status: "Cancelled",
			});
			const pendingAppointments = await AppointmentRepository.countDocuments({
				...dateFilter,
				status: "Scheduled",
			});

			res.json({
				success: true,
				data: {
					totalAppointments,
					completedAppointments,
					cancelledAppointments,
					pendingAppointments,
					completionRate:
						totalAppointments > 0
							? Math.round((completedAppointments / totalAppointments) * 100)
							: 0,
				},
			});
		} catch (error) {
			console.error("Appointment stats error:", error);
			res.status(500).json({
				success: false,
				message: "Server error while fetching appointment statistics",
			});
		}
	}
}

module.exports = new StatsController();
