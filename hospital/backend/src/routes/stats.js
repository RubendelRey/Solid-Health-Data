import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import UserRepository from "../repositories/UserRepository.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, async (req, res) => {
	try {
		const userRole = req.user.role;
		const userId = req.user._id;

		let dashboardData = {};

		switch (userRole) {
			case "administrator":
				dashboardData = await getAdminStats();
				break;
			case "doctor":
				dashboardData = await getDoctorStats(userId);
				break;
			case "patient":
				dashboardData = await getPatientStats(userId);
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
});

async function getAdminStats() {
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
		const totalPatients = await PatientRepository.count();
		const totalDoctors = await DoctorRepository.count();
		const totalUsers = await UserRepository.count();

		const newPatientsThisMonth = await PatientRepository.count({
			createdAt: { $gte: firstDayOfMonth },
		});

		const newUsersThisMonth = await UserRepository.count({
			createdAt: { $gte: firstDayOfMonth },
		});

		const newPatientsLastMonth = await PatientRepository.count({
			createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
		});
		const proceduresToday = await PatientProcedureRepository.count({
			performedDateTime: {
				$gte: today,
				$lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
			},
		});

		const pendingProcedures = await PatientProcedureRepository.count({
			status: "scheduled",
			performedDateTime: { $gte: now },
		});

		const totalProcedures = await PatientProcedureRepository.count();
		const proceduresThisMonth = await PatientProcedureRepository.count({
			createdAt: { $gte: firstDayOfMonth },
		});

		const activeDoctors = await DoctorRepository.count({ active: true });

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
			proceduresToday,
			pendingProcedures,
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

async function getDoctorStats(userId) {
	try {
		const doctor = await DoctorRepository.findOne({ user: userId });
		if (!doctor) {
			return { error: "Doctor profile not found" };
		}

		const now = new Date();
		const todayFrom = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		todayFrom.setHours(0, 0, 0, 0);
		const todayTo = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1
		);
		todayTo.setHours(0, 0, 0, 0);

		const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
		monthFrom.setHours(0, 0, 0, 0);
		const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		monthTo.setHours(0, 0, 0, 0);

		const myPatientProcedures = await PatientProcedureRepository.findAll({
			doctor: doctor._id,
		});
		const uniquePatientIds = [
			...new Set(myPatientProcedures.map((pp) => pp.patient)),
		];
		const myPatients = uniquePatientIds.length;

		const procedures = await PatientProcedureRepository.find({
			doctor: doctor._id,
		});

		const todaysProcedures = procedures.filter((p) =>
			isAppointmentDateInRange(p, todayFrom, todayTo)
		).length;

		const completedToday = procedures.filter(
			(p) =>
				isAppointmentDateInRange(p, todayFrom, todayTo) &&
				p.status === "completed"
		).length;

		const proceduresThisMonth = procedures.filter((p) =>
			isAppointmentDateInRange(p, monthFrom, monthTo)
		).length;

		const newPatientsThisWeek = 0;
		const satisfactionRate = 95;
		return {
			myPatients,
			todaysProcedures,
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

function isAppointmentDateInRange(appointment, startDate, endDate) {
	if (!appointment || !appointment.performedDateTime) return false;

	const performedDate = new Date(appointment.performedDateTime);
	const scheduledDate = new Date(appointment.scheduledDateTime);
	return (
		(performedDate >= startDate && performedDate <= endDate) ||
		(scheduledDate >= startDate && scheduledDate <= endDate)
	);
}

async function getPatientStats(userId) {
	try {
		const patient = await PatientRepository.findOne({ user: userId });
		if (!patient) {
			return { error: "Patient profile not found" };
		}

		const now = new Date();

		const procedures = await PatientProcedureRepository.find({
			subject: patient._id,
		});

		const myProcedures = procedures.length;

		const nextProcedure =
			procedures
				.filter((p) => new Date(p.scheduledDate) > now)
				.sort(
					(a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)
				)[0] || null;

		const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		const recentProcedures = await PatientProcedureRepository.count({
			subject: patient._id,
			createdAt: { $gte: threeMonthsAgo },
		});

		const myAllergies = await PatientAllergyRepository.count({
			patient: patient._id,
		});

		const healthScore = 85;
		return {
			nextProcedure: nextProcedure ? "Scheduled" : "None",
			nextProcedureDate: nextProcedure
				? nextProcedure.scheduledDate.toLocaleDateString()
				: "No upcoming procedures",
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

router.get("/patients", authenticateToken, async (req, res) => {
	try {
		const totalPatients = await PatientRepository.count();
		const activePatients = await PatientRepository.count({
			active: true,
		});
		const inactivePatients = totalPatients - activePatients;

		const patients = await PatientRepository.find({}, "birthDate");
		const ageGroups = {
			"0-18": 0,
			"19-35": 0,
			"36-50": 0,
			"51-65": 0,
			"65+": 0,
		};

		patients.forEach((patient) => {
			if (patient.birthDate) {
				const age = Math.floor(
					(Date.now() - patient.birthDate) / (365.25 * 24 * 60 * 60 * 1000)
				);
				if (age <= 18) ageGroups["0-18"]++;
				else if (age <= 35) ageGroups["19-35"]++;
				else if (age <= 50) ageGroups["36-50"]++;
				else if (age <= 65) ageGroups["51-65"]++;
				else ageGroups["65+"]++;
			}
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
});

router.get("/appointments", authenticateToken, async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		let dateFilter = {};
		if (startDate && endDate) {
			dateFilter = {
				start: {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				},
			};
		}
		const totalProcedures = await PatientProcedureRepository.count(dateFilter);
		const completedProcedures = await PatientProcedureRepository.count({
			...dateFilter,
			status: "completed",
		});
		const cancelledProcedures = await PatientProcedureRepository.count({
			...dateFilter,
			status: "cancelled",
		});
		const scheduledProcedures = await PatientProcedureRepository.count({
			...dateFilter,
			status: "scheduled",
		});

		res.json({
			success: true,
			data: {
				totalProcedures,
				completedProcedures,
				cancelledProcedures,
				scheduledProcedures,
				completionRate:
					totalProcedures > 0
						? Math.round((completedProcedures / totalProcedures) * 100)
						: 0,
			},
		});
	} catch (error) {
		console.error("Procedure stats error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching procedure statistics",
		});
	}
});

export default router;
