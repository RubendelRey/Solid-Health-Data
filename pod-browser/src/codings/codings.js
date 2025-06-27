export function getAvailableCodingsFor(context) {
	switch (context.type) {
		case "procedure":
			return getAvailableCodingForProcedure(context.field);
		case "allergy":
			return getAvailableCodingForAllergy(context.field);
		default:
			return [];
	}
}

function getAvailableCodingForProcedure(type) {
	switch (type) {
		case "bodySite":
			return ["http://snomed.info/sct"];
		case "code":
			return ["http://snomed.info/sct", "https://www.ada.org/snodent"];
		default:
			return [];
	}
}

function getAvailableCodingForAllergy(type) {
	switch (type) {
		case "clinicalStatus":
			return [
				"http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
			];
		case "code":
			return ["http://snomed.info/sct"];
		default:
			return [];
	}
}
