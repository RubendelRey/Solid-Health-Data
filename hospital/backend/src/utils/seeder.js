import dotenv from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";

import {
	getRandomAllergyStatus,
	getRandomCriticality,
	getRandomElement,
	getRandomFutureDate,
	getRandomItems,
	getRandomPastDate,
	getRandomStatus,
	getRandomVerificationStatus,
} from "../data/mock/dataUtils.js";

import AllergyCatalogRepository from "../repositories/AllergyCatalogRepository.js";
import DoctorRepository from "../repositories/DoctorRepository.js";
import LoadTestResultRepository from "../repositories/LoadTestResultRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import ProcedureCatalogRepository from "../repositories/ProcedureCatalogRepository.js";
import UserRepository from "../repositories/UserRepository.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbClient = null;

const connectToDatabase = async () => {
	try {
		dbClient = await connectDB();
		await dbClient.connect();
		console.log("MongoDB connected for seeding");
		return dbClient;
	} catch (error) {
		console.error("Database connection error:", error);
		process.exit(1);
	}
};

const closeDatabaseConnection = async () => {
	try {
		if (dbClient) {
			await dbClient.close();
			console.log("Database connection closed");
		}
	} catch (error) {
		console.error("Error closing database connection:", error);
	}
};

const userRepository = UserRepository;
const patientRepository = PatientRepository;
const doctorRepository = DoctorRepository;
const procedureCatalogRepository = ProcedureCatalogRepository;
const allergyCatalogRepository = AllergyCatalogRepository;
const patientProcedureRepository = PatientProcedureRepository;
const patientAllergyRepository = PatientAllergyRepository;
const loadTestResultRepository = LoadTestResultRepository;

const loadMockData = () => {
	try {
		const mockDataPath = join(__dirname, "../data/mock");

		const users = JSON.parse(
			readFileSync(join(mockDataPath, "users_synchronized.json"), "utf8")
		);
		const patients = JSON.parse(
			readFileSync(join(mockDataPath, "patients_synchronized.json"), "utf8")
		);
		const originalPatients = JSON.parse(
			readFileSync(join(mockDataPath, "patients.json"), "utf8")
		);
		const doctors = JSON.parse(
			readFileSync(join(mockDataPath, "doctors.json"), "utf8")
		);
		const procedureCatalog = JSON.parse(
			readFileSync(join(mockDataPath, "procedureCatalog.json"), "utf8")
		);
		const allergyCatalog = JSON.parse(
			readFileSync(join(mockDataPath, "allergyCatalog.json"), "utf8")
		);

		return {
			users,
			patients,
			originalPatients,
			doctors,
			procedureCatalog,
			allergyCatalog,
		};
	} catch (error) {
		console.error("Error loading mock data:", error);
		return {
			users: [],
			patients: [],
			originalPatients: [],
			doctors: [],
			procedureCatalog: [],
			allergyCatalog: [],
		};
	}
};

const clearDatabase = async () => {
	try {
		console.log("Clearing database...");

		await userRepository.deleteMany({});
		await patientRepository.deleteMany({});
		await doctorRepository.deleteMany({});
		await procedureCatalogRepository.deleteMany({});
		await allergyCatalogRepository.deleteMany({});
		await patientProcedureRepository.deleteMany({});
		await patientAllergyRepository.deleteMany({});
		await loadTestResultRepository.deleteMany({});

		console.log("Database cleared successfully");
	} catch (error) {
		console.error("Error clearing database:", error);
		throw error;
	}
};

const seedProcedureCatalog = async (procedureCatalog) => {
	try {
		console.log("Seeding procedure catalog...");
		const createdProcedures = await procedureCatalogRepository.createMany(
			procedureCatalog
		);
		console.log(`Created ${createdProcedures.length} procedures in catalog`);
		return createdProcedures;
	} catch (error) {
		console.error("Error seeding procedure catalog:", error);
		throw error;
	}
};

const seedAllergyCatalog = async (allergyCatalog) => {
	try {
		console.log("Seeding allergy catalog...");
		const createdAllergies = await allergyCatalogRepository.createMany(
			allergyCatalog
		);
		console.log(`Created ${createdAllergies.length} allergies in catalog`);
		return createdAllergies;
	} catch (error) {
		console.error("Error seeding allergy catalog:", error);
		throw error;
	}
};

const seedUsers = async (users, patients, doctors) => {
	try {
		console.log("Seeding users...");
		const createdUsers = [];
		const createdPatients = [];
		const createdDoctors = [];
		for (let i = 0; i < users.length; i++) {
			const userData = users[i];

			const user = await userRepository.create({
				...userData,
			});

			if (userData.role === "patient") {
				const patientData = patients.find(
					(p) => p.email === userData.email
				) || {
					name: [
						{
							use: "official",
							family: userData.profile.lastName,
							given: [userData.profile.firstName],
						},
					],
					gender: "unknown",
					birthDate: new Date("1990-01-01"),
				};

				const patient = await patientRepository.create({
					...patientData,
					user: user._id,
				});

				await userRepository.update(user._id, { patient: patient._id });
				createdPatients.push(patient);
			} else if (userData.role === "doctor") {
				const doctorData = doctors.find((d) => d.email === userData.email) || {
					name: [
						{
							use: "official",
							family: userData.profile.lastName,
							given: [userData.profile.firstName],
						},
					],
					specialty: [
						{
							coding: [
								{
									system: "http://snomed.info/sct",
									code: "62247001",
									display: "General practitioner",
								},
							],
						},
					],
					workingHours: {
						monday: { start: "09:00", end: "17:00" },
						tuesday: { start: "09:00", end: "17:00" },
						wednesday: { start: "09:00", end: "17:00" },
						thursday: { start: "09:00", end: "17:00" },
						friday: { start: "09:00", end: "17:00" },
					},
				};

				const doctor = await doctorRepository.create({
					...doctorData,
					user: user._id,
				});

				await userRepository.update(user._id, { doctor: doctor._id });
				createdDoctors.push(doctor);
			}

			createdUsers.push(user);
		}

		console.log(`Created ${createdUsers.length} users`);
		console.log(`Created ${createdPatients.length} patients`);
		console.log(`Created ${createdDoctors.length} doctors`);

		return { createdUsers, createdPatients, createdDoctors };
	} catch (error) {
		console.error("Error seeding users:", error);
		throw error;
	}
};

const seedPatientProcedures = async (
	patients,
	doctors,
	procedures,
	originalPatients
) => {
	try {
		console.log("Seeding patient procedures...");

		if (
			patients.length === 0 ||
			doctors.length === 0 ||
			procedures.length === 0
		) {
			console.log("Skipping procedure seeding - missing required data");
			return [];
		}

		const allProcedures = [];

		for (const patient of patients) {
			const patientEmail = patient.telecom?.find(
				(t) => t.system === "email"
			)?.value;
			const isOriginalPatient = originalPatients.some(
				(op) => op.email === patientEmail
			);

			if (!isOriginalPatient) {
				continue;			}

			const numProcedures = Math.floor(Math.random() * 5) + 1;
			const patientProceduresList = getRandomItems(procedures, numProcedures);

			for (const procedure of patientProceduresList) {
				const randomDoctor = getRandomElement(doctors);
				const status = getRandomStatus();

				let performedDateTime;
				let notes;
				let outcome = null;

					switch (status) {
					case "completed":
						performedDateTime = getRandomPastDate();
						notes = `Completed ${procedure.code.coding[0].display.toLowerCase()} procedure`;
						outcome = Math.random() < 0.9 ? "successful" : "complications";
						break;
					case "scheduled":
						performedDateTime = getRandomFutureDate();
						notes = `Scheduled ${procedure.code.coding[0].display.toLowerCase()}`;
						break;
					case "in-progress":
						performedDateTime = new Date();
						notes = `Currently performing ${procedure.code.coding[0].display.toLowerCase()}`;
						break;
					case "cancelled":
						performedDateTime = getRandomFutureDate();
						notes = `Cancelled ${procedure.code.coding[0].display.toLowerCase()} - patient request`;
						break;
					default:
						performedDateTime = getRandomPastDate();
						notes = `${procedure.code.coding[0].display} procedure`;
				}

				const procedureData = {
					patient: patient._id,
					doctor: randomDoctor._id,
					procedure: procedure._id,
					status,
					performedDateTime,
					notes,
				};

				if (outcome) {
					procedureData.outcome = outcome;
				}

				allProcedures.push(procedureData);
			}
		}

		if (allProcedures.length > 0) {
			const createdProcedures = await patientProcedureRepository.createMany(
				allProcedures
			);
			console.log(`Created ${createdProcedures.length} patient procedures`);

			const statusCounts = {};
			createdProcedures.forEach((proc) => {
				statusCounts[proc.status] = (statusCounts[proc.status] || 0) + 1;
			});

			Object.entries(statusCounts).forEach(([status, count]) => {
				console.log(`  - ${count} ${status} procedures`);
			});

			return createdProcedures;
		}

		return [];
	} catch (error) {
		console.error("Error seeding patient procedures:", error);
		throw error;
	}
};

const seedPatientAllergies = async (
	patients,
	allergies,
	users,
	originalPatients
) => {
	try {
		console.log("Seeding patient allergies...");

		if (patients.length === 0 || allergies.length === 0) {
			console.log("Skipping allergy seeding - missing required data");
			return [];
		}

		const doctors = users.filter((u) => u.role === "doctor");
		const allAllergies = [];

		for (const patient of patients) {
			const patientEmail = patient.telecom?.find(
				(t) => t.system === "email"
			)?.value;
			const isOriginalPatient = originalPatients.some(
				(op) => op.email === patientEmail
			);

			if (!isOriginalPatient) {
				continue;			}

			const numAllergies = Math.floor(Math.random() * 3) + 1;			const patientAllergiesList = getRandomItems(allergies, numAllergies);
			const recorder = doctors.length > 0 ? getRandomElement(doctors) : null;

			for (const allergy of patientAllergiesList) {
				const clinicalStatus = getRandomAllergyStatus();
				const criticality = getRandomCriticality();
				const verificationStatus = getRandomVerificationStatus();

				allAllergies.push({
					patient: patient._id,
					allergy: allergy._id,
					recorder: recorder?._id,
					clinicalStatus: {
						coding: [
							{
								system:
									"http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
								code: clinicalStatus,
								display:
									clinicalStatus.charAt(0).toUpperCase() +
									clinicalStatus.slice(1),
							},
						],
					},
					verificationStatus: {
						coding: [
							{
								system:
									"http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
								code: verificationStatus,
								display:
									verificationStatus.charAt(0).toUpperCase() +
									verificationStatus.slice(1),
							},
						],
					},
					criticality,
					recordedDate: getRandomPastDate(),
					onsetDateTime: getRandomPastDate(365 * 5),					note: `Patient reported allergy to ${allergy.code.coding[0].display.toLowerCase()}`,
				});
			}
		}

		if (allAllergies.length > 0) {
			const createdAllergies = await patientAllergyRepository.createMany(
				allAllergies
			);
			console.log(`Created ${createdAllergies.length} patient allergies`);

			const activeAllergies = createdAllergies.filter(
				(a) => a.clinicalStatus?.coding[0]?.code === "active"
			).length;
			const highCriticalityAllergies = createdAllergies.filter(
				(a) => a.criticality === "high"
			).length;
			const confirmedAllergies = createdAllergies.filter(
				(a) => a.verificationStatus?.coding[0]?.code === "confirmed"
			).length;

			console.log(`  - ${activeAllergies} active allergies`);
			console.log(`  - ${highCriticalityAllergies} high criticality allergies`);
			console.log(`  - ${confirmedAllergies} confirmed allergies`);

			return createdAllergies;
		}

		return [];
	} catch (error) {
		console.error("Error seeding patient allergies:", error);
		throw error;
	}
};

const seedDatabase = async () => {
	try {
		console.log("Starting database seeding...");

		await connectToDatabase();

		const mockData = loadMockData();

		const procedures = await seedProcedureCatalog(mockData.procedureCatalog);
		const allergies = await seedAllergyCatalog(mockData.allergyCatalog);

		const { createdUsers, createdPatients, createdDoctors } = await seedUsers(
			mockData.users,
			mockData.patients,
			mockData.doctors
		);

		await seedPatientProcedures(
			createdPatients,
			createdDoctors,
			procedures,
			mockData.originalPatients
		);
		await seedPatientAllergies(
			createdPatients,
			allergies,
			createdUsers,
			mockData.originalPatients
		);

		console.log("Database seeding completed successfully!");
	} catch (error) {
		console.error("Error during database seeding:", error);
		throw error;
	} finally {
	}
};

const args = process.argv.slice(2);
const shouldClearDatabase = args.includes("-d") || args.includes("--delete");

const main = async () => {
	try {
		if (shouldClearDatabase) {
			await connectToDatabase();
			await clearDatabase();
			console.log("Database cleared. Exiting...");
			process.exit(0);
		} else {
			await seedDatabase();
			process.exit(0);
		}
	} catch (error) {
		console.error("Seeding failed:", error);
		process.exit(1);
	}
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}

export default { seedDatabase, clearDatabase };
