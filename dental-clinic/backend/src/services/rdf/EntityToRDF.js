import { graph } from "rdflib";

import { ADAService } from "./AdaService.js";
import { FDITeethService } from "./FdiTeethService.js";
import { FHIR } from "./Fhir.js";
import { NamingUrls } from "./NamingUrls.js";
import { SnomedService } from "./SnomedService.js";

import AllergyCatalogueRepository from "../../repositories/AllergyCatalogueRepository.js";
import DoctorRepository from "../../repositories/DoctorRepository.js";
import InterventionTypeRepository from "../../repositories/InterventionTypeRepository.js";
import PatientRepository from "../../repositories/PatientRepository.js";

export class EntityToRDF {
	static async convertIntervention(intervention) {
		let g = graph();

		g.add(
			"http://example.com/" + intervention._id.toString(),
			g.sym(FHIR.CODE),
			g.sym("http://example.com/" + intervention.interventionType.toString())
		);
		g.add(
			"http://example.com/" + intervention._id.toString(),
			g.sym(FHIR.OCURRENCEDATETIME),
			intervention.date
		);
		g.add(
			"http://example.com/" + intervention._id.toString(),
			g.sym(FHIR.STATUS),
			this.convertState(intervention.state)
		);

		if (intervention.doctor) {
			g.add(
				"http://example.com/" + intervention._id.toString(),
				g.sym(FHIR.PERFORMER),
				g.sym(FHIR.PERFORMER + "/" + intervention.doctor.toString())
			);

			g.add(
				FHIR.PERFORMER + "/" + intervention.doctor.toString(),
				g.sym(FHIR.ACTOR),
				g.sym("http://example.com/" + intervention.doctor.toString())
			);

			g.addAll((await this.convertDoctor(intervention.doctor)).statements);
		}

		intervention.teethAffected.forEach((tooth) => {
			g.add(
				"http://example.com/" + intervention._id.toString(),
				g.sym(FHIR.BODYSITE),
				g.sym(NamingUrls.FDI + "/" + tooth)
			);

			g.add(
				NamingUrls.FDI + "/" + tooth,
				g.sym(FHIR.CODING),
				g.sym(FHIR.CODING + "/" + tooth)
			);
			g.add(
				NamingUrls.FDI + "/" + tooth,
				g.sym(FHIR.TEXT),
				FDITeethService.getFDITeethName(tooth)
			);

			g.add(
				FHIR.CODING + "/" + tooth,
				g.sym(FHIR.SYSTEM),
				g.sym(NamingUrls.FDI)
			);
			g.add(FHIR.CODING + "/" + tooth, g.sym(FHIR.CODE), tooth);
			g.add(
				FHIR.CODING + "/" + tooth,
				g.sym(FHIR.DISPLAY),
				FDITeethService.getFDITeethName(tooth)
			);
		});

		g.addAll(
			(await this.convertInterventionType(intervention.interventionType))
				.statements
		);

		return g;
	}

	static async convertInterventionType(interventionTypeId) {
		let g = graph();
		let interventionType = await InterventionTypeRepository.findById(
			interventionTypeId
		);

		g.add(
			"http://example.com/" + interventionType._id.toString(),
			g.sym(FHIR.CODING),
			g.sym(FHIR.CODING + "/" + interventionType._id.toString())
		);
		g.add(
			"http://example.com/" + interventionType._id.toString(),
			g.sym(FHIR.TEXT),
			interventionType.name
		);

		g.add(
			FHIR.CODING + "/" + interventionType._id.toString(),
			g.sym(FHIR.SYSTEM),
			g.sym(NamingUrls.ADA)
		);
		g.add(
			FHIR.CODING + "/" + interventionType._id.toString(),
			g.sym(FHIR.CODE),
			await ADAService.getAdaCode(interventionType.name)
		);
		g.add(
			FHIR.CODING + "/" + interventionType._id.toString(),
			g.sym(FHIR.DISPLAY),
			interventionType.name
		);

		return g;
	}

	static async convertPatient(patientId) {
		let g = graph();
		let patient = await PatientRepository.findById(patientId);

		g.add(
			"http://example.com/" + patient._id.toString(),
			g.sym(FHIR.IDENTIFIER),
			patient._id.toString()
		);
		let fullNameId =
			FHIR.NAME +
			"/" +
			patient.name +
			patient.surname +
			"/" +
			patient._id.toString();
		g.add(
			"http://example.com/" + patient._id.toString(),
			g.sym(FHIR.NAME),
			g.sym(fullNameId)
		);
		g.add(fullNameId, g.sym(FHIR.TEXT), patient.name + " " + patient.surname);
		g.add(fullNameId, g.sym(FHIR.GIVEN), patient.name);
		g.add(fullNameId, g.sym(FHIR.FAMILY), patient.surname);
		g.add(
			"http://example.com/" + patient._id.toString(),
			g.sym(FHIR.BIRTHDATE),
			patient.dateOfBirth
		);
		g.add(
			"http://example.com/" + patient._id.toString(),
			g.sym(FHIR.GENDER),
			patient.gender
		);

		for (let phone of patient.phoneNumbers) {
			g.add(
				"http://example.com/" + patient._id.toString(),
				g.sym(FHIR.TELECOM),
				g.sym(FHIR.TELECOM + "/" + phone)
			);

			g.add(FHIR.TELECOM + "/" + phone, g.sym(FHIR.SYSTEM), "phone");
			g.add(FHIR.TELECOM + "/" + phone, g.sym(FHIR.VALUE), phone);
		}

		g.add(
			"http://example.com/" + patient._id.toString(),
			g.sym(FHIR.TELECOM),
			g.sym(FHIR.TELECOM + "/" + patient.email)
		);

		g.add(FHIR.TELECOM + "/" + patient.email, g.sym(FHIR.SYSTEM), "email");
		g.add(FHIR.TELECOM + "/" + patient.email, g.sym(FHIR.VALUE), patient.email);

		return g;
	}

	static async convertDoctor(doctorId) {
		let g = graph();
		let doctor = await DoctorRepository.findById(doctorId);
		g.add(
			"http://example.com/" + doctor._id.toString(),
			g.sym(FHIR.NAME),
			doctor.name
		);

		return g;
	}

	static async convertAllergy(allergy) {
		let g = graph();

		g.add(
			"http://example.com/" + allergy._id.toString(),
			g.sym(FHIR.CODE),
			g.sym("http://example.com/" + allergy.allergyId.toString())
		);
		g.add(
			"http://example.com/" + allergy._id.toString(),
			g.sym(FHIR.CRITICALITY),
			allergy.severity
		);
		g.add(
			"http://example.com/" + allergy._id.toString(),
			g.sym(FHIR.CLINICALSTATUS),
			g.sym(FHIR.CLINICALSTATUS + "/" + allergy.status)
		);
		g.add(
			FHIR.CLINICALSTATUS + "/" + allergy.status,
			g.sym(FHIR.TEXT),
			allergy.status
		);
		g.add(
			FHIR.CLINICALSTATUS + "/" + allergy.status,
			g.sym(FHIR.CODING),
			g.sym(FHIR.CODING + "/" + allergy.status)
		);
		g.add(
			FHIR.CODING + "/" + allergy.status,
			g.sym(FHIR.SYSTEM),
			g.sym("http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical")
		);
		g.add(FHIR.CODING + "/" + allergy.status, g.sym(FHIR.CODE), allergy.status);
		g.add(
			FHIR.CODING + "/" + allergy.status,
			g.sym(FHIR.DISPLAY),
			allergy.status.charAt(0).toUpperCase() + allergy.status.slice(1)
		);
		g.add(
			"http://example.com/" + allergy._id.toString(),
			g.sym(FHIR.RECORDEDDATE),
			allergy.detectionDate
		);

		g.addAll((await this.convertAllergyType(allergy.allergyId)).statements);

		return g;
	}

	static async convertAllergyType(allergyTypeId) {
		let g = graph();
		let allergyType = await AllergyCatalogueRepository.findById(allergyTypeId);

		g.add(
			"http://example.com/" + allergyType._id.toString(),
			g.sym(FHIR.CODING),
			g.sym(FHIR.CODING + "/" + allergyType._id.toString())
		);
		g.add(
			"http://example.com/" + allergyType._id.toString(),
			g.sym(FHIR.TEXT),
			allergyType.name
		);

		g.add(
			FHIR.CODING + "/" + allergyType._id.toString(),
			g.sym(FHIR.SYSTEM),
			g.sym(NamingUrls.SNOMEDCT)
		);
		g.add(
			FHIR.CODING + "/" + allergyType._id.toString(),
			g.sym(FHIR.CODE),
			await SnomedService.getSnomedCode(allergyType.code)
		);
		g.add(
			FHIR.CODING + "/" + allergyType._id.toString(),
			g.sym(FHIR.DISPLAY),
			allergyType.name
		);

		return g;
	}

	static convertState(status) {
		switch (status) {
			case "completed":
				return "completed";
			case "canceled":
				return "stopped";
			case "scheduled":
				return "not-done";
			case "in-progress":
				return "in-progress";
			default:
				return "unknown";
		}
	}

	static convertStatus(status) {
		switch (status) {
			case "completed":
				return "completed";
			case "stopped":
				return "canceled";
			case "not-done":
				return "scheduled";
			case "in-progress":
				return "in-progress";
			default:
				return "scheduled";
		}
	}
}
