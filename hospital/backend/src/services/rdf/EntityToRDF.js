import { graph } from "rdflib";
import AllergyCatalogRepository from "../../repositories/AllergyCatalogRepository.js";
import DoctorRepository from "../../repositories/DoctorRepository.js";
import ProcedureCatalogRepository from "../../repositories/ProcedureCatalogRepository.js";

export default class EntityToRDF {
	static EX = "http://example.com/";
	static FHIR = "http://hl7.org/fhir/";

	static async convertPatient(patient) {
		let g = graph();

		g.add(
			this.EX + patient._id.toString(),
			g.sym(this.FHIR + "gender"),
			patient.gender
		);
		g.add(
			this.EX + patient._id.toString(),
			g.sym(this.FHIR + "birthDate"),
			new Date(patient.birthDate)
		);

		for (let name of patient.name) {
			let fullName = name.given.join(" ") + " " + name.family;
			let fullNameId = fullName.replace(" ", "") + "/" + patient._id.toString();
			g.add(
				this.EX + patient._id.toString(),
				g.sym(this.FHIR + "name"),
				g.sym(this.FHIR + "name/" + fullNameId)
			);

			g.add(
				this.FHIR + "name/" + fullNameId,
				g.sym(this.FHIR + "text"),
				fullName
			);

			g.add(
				this.FHIR + "name/" + fullNameId,
				g.sym(this.FHIR + "family"),
				name.family
			);

			for (let givenName of name.given) {
				g.add(
					this.FHIR + "name/" + fullNameId + "/" + patient._id.toString(),
					g.sym(this.FHIR + "given"),
					givenName
				);
			}
		}

		for (let telecom of patient.telecom) {
			g.add(
				this.EX + patient._id.toString(),
				g.sym(this.FHIR + "telecom"),
				g.sym(this.FHIR + "telecom/" + telecom.value)
			);

			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "system"),
				telecom.system
			);
			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "use"),
				telecom.use
			);
			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "value"),
				telecom.value
			);
		}

		return g;
	}

	static async convertProcedure(procedure) {
		let g = graph();

		g.add(
			this.EX + procedure._id.toString(),
			g.sym(this.FHIR + "status"),
			procedure.status
		);

		g.addAll(
			(await this.convertProcedureType(procedure.procedure, procedure._id))
				.statements
		);

		g.add(
			this.EX + procedure._id.toString(),
			g.sym(this.FHIR + "occurrenceDateTime"),
			new Date(procedure.performedDateTime || procedure.scheduledDateTime)
		);

		if (procedure.doctor) {
			g.add(
				this.EX + procedure._id.toString(),
				g.sym(this.FHIR + "performer"),
				g.sym(this.FHIR + "performer" + "/" + procedure.doctor.toString())
			);

			g.add(
				this.FHIR + "performer" + "/" + procedure.doctor.toString(),
				g.sym(this.FHIR + "actor"),
				g.sym(this.EX + procedure.doctor.toString())
			);

			g.addAll((await this.convertDoctor(procedure.doctor)).statements);
		}

		return g;
	}

	static async convertProcedureType(procedureTypeId, procedureId) {
		let g = graph();

		let procedureType = await ProcedureCatalogRepository.findById(
			procedureTypeId
		);

		g.add(
			this.EX + procedureId.toString(),
			g.sym(this.FHIR + "category"),
			g.sym(this.EX + procedureType._id.toString())
		);

		g.add(
			this.EX + procedureType._id.toString(),
			g.sym(this.FHIR + "text"),
			procedureType.category.coding[0].display
		);

		for (let coding of procedureType.category.coding) {
			g.add(
				this.EX + procedureType._id.toString(),
				g.sym(this.FHIR + "coding"),
				g.sym(this.FHIR + "coding/" + coding.code)
			);

			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "system"),
				g.sym(coding.system)
			);

			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "code"),
				coding.code
			);

			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "display"),
				coding.display
			);
		}

		g.add(
			this.EX + procedureId,
			g.sym(this.FHIR + "code"),
			g.sym(this.FHIR + "code/" + procedureId)
		);

		g.add(
			this.FHIR + "code/" + procedureId,
			g.sym(this.FHIR + "text"),
			procedureType.code.text
		);

		for (let coding of procedureType.code.coding) {
			g.add(
				this.FHIR + "code/" + procedureId,
				g.sym(this.FHIR + "coding"),
				g.sym(this.FHIR + "code/" + procedureId + "/coding/" + coding.code)
			);
			g.add(
				this.FHIR + "code/" + procedureId + "/coding/" + coding.code,
				g.sym(this.FHIR + "system"),
				g.sym(coding.system)
			);
			g.add(
				this.FHIR + "code/" + procedureId + "/coding/" + coding.code,
				g.sym(this.FHIR + "code"),
				coding.code
			);
			g.add(
				this.FHIR + "code/" + procedureId + "/coding/" + coding.code,
				g.sym(this.FHIR + "display"),
				coding.display
			);
		}

		return g;
	}

	static async convertAllergy(allergy) {
		let g = graph();

		let clinicalStatusId =
			this.FHIR + "clinicalStatus/" + allergy.clinicalStatus.coding[0].code;

		g.add(
			this.EX + allergy._id.toString(),
			g.sym(this.FHIR + "clinicalStatus"),
			g.sym(clinicalStatusId)
		);

		g.add(
			clinicalStatusId,
			g.sym(this.FHIR + "text"),
			allergy.clinicalStatus.coding[0].display
		);

		for (let coding of allergy.clinicalStatus.coding) {
			g.add(
				clinicalStatusId,
				g.sym(this.FHIR + "coding"),
				g.sym(this.FHIR + "coding/" + coding.code)
			);

			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "system"),
				g.sym(coding.system)
			);
			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "code"),
				coding.code
			);
			g.add(
				this.FHIR + "coding/" + coding.code,
				g.sym(this.FHIR + "display"),
				coding.display
			);
		}

		g.add(
			this.EX + allergy._id.toString(),
			g.sym(this.FHIR + "criticality"),
			allergy.criticality
		);

		g.add(
			this.EX + allergy._id.toString(),
			g.sym(this.FHIR + "recordedDate"),
			new Date(allergy.recordedDate)
		);

		g.addAll(
			(await this.convertAllergyType(allergy.allergy, allergy._id)).statements
		);

		return g;
	}

	static async convertAllergyType(allergyTypeId, allergyId) {
		let g = graph();

		let allergyType = await AllergyCatalogRepository.findById(allergyTypeId);

		for (let category of allergyType.category) {
			g.add(
				this.EX + allergyId.toString(),
				g.sym(this.FHIR + "category"),
				category
			);
		}

		g.add(
			this.EX + allergyId.toString(),
			g.sym(this.FHIR + "code"),
			g.sym(this.FHIR + "code/" + allergyType._id.toString())
		);

		g.add(
			this.FHIR + "code/" + allergyTypeId.toString(),
			g.sym(this.FHIR + "text"),
			allergyType.code.text
		);

		for (let coding of allergyType.code.coding) {
			g.add(
				this.FHIR + "code/" + allergyTypeId.toString(),
				g.sym(this.FHIR + "coding"),
				g.sym(
					this.FHIR +
						"code/" +
						allergyTypeId.toString() +
						"/coding/" +
						coding.code
				)
			);

			g.add(
				this.FHIR +
					"code/" +
					allergyTypeId.toString() +
					"/coding/" +
					coding.code,
				g.sym(this.FHIR + "system"),
				g.sym(coding.system)
			);
			g.add(
				this.FHIR +
					"code/" +
					allergyTypeId.toString() +
					"/coding/" +
					coding.code,
				g.sym(this.FHIR + "code"),
				coding.code
			);
			g.add(
				this.FHIR +
					"code/" +
					allergyTypeId.toString() +
					"/coding/" +
					coding.code,
				g.sym(this.FHIR + "display"),
				coding.display
			);
		}

		return g;
	}

	static async convertDoctor(doctorId) {
		let g = graph();

		let doctor = await DoctorRepository.findById(doctorId);

		g.add(
			this.EX + doctor._id.toString(),
			g.sym(this.FHIR + "gender"),
			doctor.gender
		);

		g.add(
			this.EX + doctor._id.toString(),
			g.sym(this.FHIR + "birthDate"),
			new Date(doctor.birthDate)
		);

		for (let name of doctor.name) {
			let fullName = name.given.join(" ") + " " + name.family;
			let fullNameId = fullName.replace(" ", "") + "/" + doctor._id.toString();
			g.add(
				this.EX + doctor._id.toString(),
				g.sym(this.FHIR + "name"),
				g.sym(this.FHIR + "name/" + fullNameId)
			);

			g.add(
				g.sym(this.FHIR + "name/" + fullNameId),
				g.sym(this.FHIR + "text"),
				fullName
			);

			g.add(
				g.sym(this.FHIR + "name/" + fullNameId),
				g.sym(this.FHIR + "family"),
				name.family
			);

			for (let givenName of name.given) {
				g.add(
					this.FHIR + "name/" + fullNameId + "/" + doctor._id.toString(),
					g.sym(this.FHIR + "given"),
					givenName
				);
			}
		}

		for (let telecom of doctor.telecom) {
			g.add(
				this.EX + doctor._id.toString(),
				g.sym(this.FHIR + "telecom"),
				g.sym(this.FHIR + "telecom/" + telecom.value)
			);

			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "system"),
				telecom.system
			);
			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "use"),
				telecom.use
			);
			g.add(
				this.FHIR + "telecom/" + telecom.value,
				g.sym(this.FHIR + "value"),
				telecom.value
			);
		}

		return g;
	}
}
