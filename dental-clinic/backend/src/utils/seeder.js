import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
	getRandomFutureDate,
	getRandomItems,
	getRandomPastDate,
	getRandomTeeth,
} from "../data/mock/dataUtils.js";

import allergyCatalogueRepo from "../repositories/AllergyCatalogueRepository.js";
import doctorRepo from "../repositories/DoctorRepository.js";
import interventionRepo from "../repositories/InterventionRepository.js";
import interventionTypeRepo from "../repositories/InterventionTypeRepository.js";
import loadTestResultRepo from "../repositories/LoadTestResultRepository.js";
import patientAllergyRepo from "../repositories/PatientAllergyRepository.js";
import patientRepo from "../repositories/PatientRepository.js";
import userRepo from "../repositories/UserRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_DATA_DIR = path.join(__dirname, "..", "data", "mock");

dotenv.config();

const loadMockData = (filename) => {
	try {
		const filePath = path.join(MOCK_DATA_DIR, filename);
		const data = fs.readFileSync(filePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error(`Error loading mock data from ${filename}: ${error.message}`);
		return [];
	}
};

const importData = async () => {
	try {
		await userRepo.deleteAll();
		await patientRepo.deleteAll();
		await interventionTypeRepo.deleteAll();
		await interventionRepo.deleteAll();
		await allergyCatalogueRepo.deleteAll();
		await doctorRepo.deleteAll();
		await loadTestResultRepo.deleteAll();

		console.log("Data cleared from database...");

		const users = loadMockData("users_synchronized.json");
		const patients = loadMockData("patients_synchronized.json");
		const originalPatients = loadMockData("patients.json");
		const interventionTypes = loadMockData("interventionTypes.json");
		const allergies = loadMockData("allergies.json");
		const doctors = loadMockData("doctors.json");

		const processedPatients = patients.map((patient) => ({
			...patient,
			dateOfBirth: new Date(patient.dateOfBirth),
		}));

		const originalDentalPatients = processedPatients.filter((patient) =>
			originalPatients.some((op) => op.email === patient.email)
		);

		console.log(
			`Original dental clinic patients: ${originalDentalPatients.length}`
		);
		console.log(
			`Hospital patients (no medical data): ${
				processedPatients.length - originalDentalPatients.length
			}`
		);

		const createdUsers = [];
		for (const user of users) {
			createdUsers.push(await userRepo.create(user));
		}
		console.log(`${createdUsers.length} users imported`);

		const createdPatients = [];
		for (const patient of processedPatients) {
			createdPatients.push(await patientRepo.create(patient));
		}
		console.log(`${createdPatients.length} patients imported`);

		const createdDoctors = [];
		for (const doctor of doctors) {
			let user = createdUsers.find(
				(u) => u.email === doctor.email && u.role === "doctor"
			);
			doctor.userId = user ? user._id : null;
			createdDoctors.push(await doctorRepo.create(doctor));
		}
		console.log(`${createdDoctors.length} doctors imported`);

		const patientUsers = [];
		for (const patient of createdPatients) {
			const patientUser = await userRepo.create({
				name: `${patient.name} ${patient.surname}`,
				email: patient.email,
				password: "password",
				role: "patient",
				patientId: patient._id,
			});
			patientUsers.push(patientUser);
			await patientRepo.update(patient._id, {
				userId: patientUser._id,
			});
		}
		console.log(`${patientUsers.length} patient user accounts created`);

		const createdInterventionTypes = [];
		for (const interventionType of interventionTypes) {
			createdInterventionTypes.push(
				await interventionTypeRepo.create(interventionType)
			);
		}
		console.log(
			`${createdInterventionTypes.length} intervention types imported`
		);

		const createdAllergies = [];
		for (const allergy of allergies) {
			createdAllergies.push(await allergyCatalogueRepo.create(allergy));
		}
		console.log(`${createdAllergies.length} allergies imported`);

		const historicalInterventions = [];

		for (let i = 0; i < 50; i++) {
			const randomPatient =
				originalDentalPatients[
					Math.floor(Math.random() * originalDentalPatients.length)
				];
			const randomDoctor =
				createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
			const randomInterventionType =
				createdInterventionTypes[
					Math.floor(Math.random() * createdInterventionTypes.length)
				];

			const createdPatient = createdPatients.find(
				(p) => p.email === randomPatient.email
			);

			historicalInterventions.push({
				interventionType: randomInterventionType._id,
				patient: createdPatient._id,
				doctor: randomDoctor._id,
				teethAffected: getRandomTeeth(Math.floor(Math.random() * 4) + 1),
				date: getRandomPastDate(),
				state: "completed",
				notes: `Routine ${randomInterventionType.name.toLowerCase()} procedure`,
				treatment: `Standard ${randomInterventionType.category} treatment`,
			});
		}

		const upcomingInterventions = [];

		for (let i = 0; i < 30; i++) {
			const randomPatient =
				originalDentalPatients[
					Math.floor(Math.random() * originalDentalPatients.length)
				];
			const randomDoctor =
				createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
			const randomInterventionType =
				createdInterventionTypes[
					Math.floor(Math.random() * createdInterventionTypes.length)
				];

			const createdPatient = createdPatients.find(
				(p) => p.email === randomPatient.email
			);

			upcomingInterventions.push({
				interventionType: randomInterventionType._id,
				patient: createdPatient._id,
				doctor: randomDoctor._id,
				teethAffected: getRandomTeeth(Math.floor(Math.random() * 4) + 1),
				date: getRandomFutureDate(),
				state: "scheduled",
				notes: `Scheduled ${randomInterventionType.name.toLowerCase()}`,
				treatment: `Planned ${randomInterventionType.category} treatment`,
				cost: randomInterventionType.cost,
			});
		}

		const inProgressInterventions = [];

		for (let i = 0; i < 10; i++) {
			const randomPatient =
				originalDentalPatients[
					Math.floor(Math.random() * originalDentalPatients.length)
				];
			const randomDoctor =
				createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
			const randomInterventionType =
				createdInterventionTypes[
					Math.floor(Math.random() * createdInterventionTypes.length)
				];

			const createdPatient = createdPatients.find(
				(p) => p.email === randomPatient.email
			);

			inProgressInterventions.push({
				interventionType: randomInterventionType._id,
				patient: createdPatient._id,
				doctor: randomDoctor._id,
				teethAffected: getRandomTeeth(Math.floor(Math.random() * 4) + 1),
				date: new Date(),
				state: "in-progress",
				notes: `Ongoing treatment, follow-up required`,
				treatment: `Multi-stage ${randomInterventionType.category} treatment`,
				cost: randomInterventionType.cost * 1.2,
			});
		}

		const allInterventions = [
			...historicalInterventions,
			...upcomingInterventions,
			...inProgressInterventions,
		];

		const createdInterventions = [];
		for (const intervention of allInterventions) {
			createdInterventions.push(await interventionRepo.create(intervention));
		}
		console.log(`${createdInterventions.length} interventions created`);

		for (const originalPatient of originalDentalPatients) {
			const createdPatient = createdPatients.find(
				(p) => p.email === originalPatient.email
			);

			if (!createdPatient) continue;

			const numAllergies = Math.floor(Math.random() * 3) + 1;
			const randomAllergies = getRandomItems(createdAllergies, numAllergies);

			const allergiesData = randomAllergies.map((allergy) => ({
				allergyId: allergy._id,
				status: Math.random() < 0.8 ? "active" : "inactive",
				severity: ["low", "high"][Math.floor(Math.random() * 2)],
				detectionDate: getRandomPastDate(),
				patientId: createdPatient._id,
			}));

			for (const allergyData of allergiesData) {
				await patientAllergyRepo.create(allergyData);
			}
		}
		console.log("Sample allergies added to patients");

		console.log("Data import completed successfully!");
		process.exit();
	} catch (error) {
		console.error(`Error importing data: ${error.message}`);
		process.exit(1);
	}
};

const destroyData = async () => {
	try {
		await userRepo.deleteAll();
		await patientRepo.deleteAll();
		await interventionTypeRepo.deleteAll();
		await interventionRepo.deleteAll();
		await allergyCatalogueRepo.deleteAll();
		await doctorRepo.deleteAll();
		await patientAllergyRepo.deleteAll();

		console.log("All data destroyed from database!");
		process.exit();
	} catch (error) {
		console.error(`Error destroying data: ${error.message}`);
		process.exit(1);
	}
};

if (process.argv[2] === "-d") {
	destroyData();
} else {
	importData();
}
