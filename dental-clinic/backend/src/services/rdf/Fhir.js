export class FHIR {
	static BASE = "http://hl7.org/fhir/";

	static ID = this.BASE + "id";

	static IDENTIFIER = this.BASE + "identifier";
	static TEXT = this.BASE + "text";
	static STATUS = this.BASE + "status";
	static BODYSITE = this.BASE + "bodySite";
	static OCURRENCEDATETIME = this.BASE + "occurrenceDateTime";

	static CODING = this.BASE + "coding";

	static SYSTEM = this.BASE + "system";
	static CODE = this.BASE + "code";
	static DISPLAY = this.BASE + "display";

	static NAME = this.BASE + "name";
	static FAMILY = this.BASE + "family";
	static GIVEN = this.BASE + "given";
	static BIRTHDATE = this.BASE + "birthDate";
	static GENDER = this.BASE + "gender";

	static TELECOM = this.BASE + "telecom";

	static VALUE = this.BASE + "value";

	static CLINICALSTATUS = this.BASE + "clinicalStatus";
	static RECORDEDDATE = this.BASE + "recordedDate";
	static CRITICALITY = this.BASE + "criticality";

	static PERFORMER = this.BASE + "performer";
	static ACTOR = this.BASE + "actor";
}
