import { v4 as uuidv4 } from "uuid";

export const FHIR_RESOURCE_TYPES = {
	PATIENT: "Patient",
	OBSERVATION: "Observation",
	CONDITION: "Condition",
	MEDICATION_REQUEST: "MedicationRequest",
	PROCEDURE: "Procedure",
	ENCOUNTER: "Encounter",
	DIAGNOSTIC_REPORT: "DiagnosticReport",
	ALLERGY_INTOLERANCE: "AllergyIntolerance",
	IMMUNIZATION: "Immunization",
	CARE_PLAN: "CarePlan",
};

export const OBSERVATION_CATEGORIES = {
	VITAL_SIGNS: "vital-signs",
	LABORATORY: "laboratory",
	EXAM: "exam",
	SURVEY: "survey",
	SOCIAL_HISTORY: "social-history",
	THERAPY: "therapy",
	ACTIVITY: "activity",
};

export const CONDITION_CATEGORIES = {
	PROBLEM_LIST: "problem-list-item",
	ENCOUNTER_DIAGNOSIS: "encounter-diagnosis",
	HEALTH_CONCERN: "health-concern",
};

export const FHIR_STATUS = {
	ACTIVE: "active",
	INACTIVE: "inactive",
	RESOLVED: "resolved",
	FINAL: "final",
	PRELIMINARY: "preliminary",
	CANCELLED: "cancelled",
	COMPLETED: "completed",
	IN_PROGRESS: "in-progress",
};

export const createFhirPatient = (patientData) => {
	return {
		resourceType: FHIR_RESOURCE_TYPES.PATIENT,
		id: patientData.id || uuidv4(),
		meta: {
			lastUpdated: new Date().toISOString(),
			profile: ["http://hl7.org/fhir/StructureDefinition/Patient"],
		},
		identifier: patientData.identifier
			? [
					{
						use: "usual",
						type: {
							coding: [
								{
									system: "http://terminology.hl7.org/CodeSystem/v2-0203",
									code: "MR",
									display: "Medical Record Number",
								},
							],
						},
						value: patientData.identifier,
					},
			  ]
			: [],
		active: true,
		name: [
			{
				use: "official",
				family: patientData.familyName || "",
				given: patientData.givenName ? [patientData.givenName] : [],
			},
		],
		telecom:
			patientData.email || patientData.phone
				? [
						...(patientData.email
							? [
									{
										system: "email",
										value: patientData.email,
										use: "home",
									},
							  ]
							: []),
						...(patientData.phone
							? [
									{
										system: "phone",
										value: patientData.phone,
										use: "home",
									},
							  ]
							: []),
				  ]
				: [],
		gender: patientData.gender || "unknown",
		birthDate: patientData.birthDate || null,
		address: patientData.address
			? [
					{
						use: "home",
						line: [patientData.address.line],
						city: patientData.address.city,
						state: patientData.address.state,
						postalCode: patientData.address.postalCode,
						country: patientData.address.country,
					},
			  ]
			: [],
	};
};

export const createFhirObservation = (observationData) => {
	return {
		resourceType: FHIR_RESOURCE_TYPES.OBSERVATION,
		id: observationData.id || uuidv4(),
		meta: {
			lastUpdated: new Date().toISOString(),
			profile: ["http://hl7.org/fhir/StructureDefinition/Observation"],
		},
		status: observationData.status || FHIR_STATUS.FINAL,
		category: [
			{
				coding: [
					{
						system:
							"http://terminology.hl7.org/CodeSystem/observation-category",
						code: observationData.category || OBSERVATION_CATEGORIES.EXAM,
						display: observationData.categoryDisplay || "Exam",
					},
				],
			},
		],
		code: {
			coding: [
				{
					system: observationData.codeSystem || "http://loinc.org",
					code: observationData.code || "72133-2",
					display:
						observationData.codeDisplay ||
						observationData.name ||
						"Observation",
				},
			],
			text: observationData.name || "Observation",
		},
		subject: {
			reference: observationData.patientReference || "Patient/unknown",
		},
		effectiveDateTime:
			observationData.effectiveDateTime || new Date().toISOString(),
		valueString: observationData.valueString,
		valueQuantity: observationData.valueQuantity
			? {
					value: observationData.valueQuantity.value,
					unit: observationData.valueQuantity.unit,
					system: "http://unitsofmeasure.org",
					code:
						observationData.valueQuantity.code ||
						observationData.valueQuantity.unit,
			  }
			: undefined,
		note: observationData.note
			? [
					{
						text: observationData.note,
					},
			  ]
			: [],
	};
};

export const createFhirCondition = (conditionData) => {
	return {
		resourceType: FHIR_RESOURCE_TYPES.CONDITION,
		id: conditionData.id || uuidv4(),
		meta: {
			lastUpdated: new Date().toISOString(),
			profile: ["http://hl7.org/fhir/StructureDefinition/Condition"],
		},
		clinicalStatus: {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
					code: conditionData.clinicalStatus || FHIR_STATUS.ACTIVE,
					display: conditionData.clinicalStatusDisplay || "Active",
				},
			],
		},
		category: [
			{
				coding: [
					{
						system: "http://terminology.hl7.org/CodeSystem/condition-category",
						code: conditionData.category || CONDITION_CATEGORIES.PROBLEM_LIST,
						display: conditionData.categoryDisplay || "Problem List Item",
					},
				],
			},
		],
		code: {
			coding: [
				{
					system: conditionData.codeSystem || "http://snomed.info/sct",
					code: conditionData.code || "64572001",
					display:
						conditionData.codeDisplay || conditionData.name || "Condition",
				},
			],
			text: conditionData.name || "Condition",
		},
		subject: {
			reference: conditionData.patientReference || "Patient/unknown",
		},
		onsetDateTime: conditionData.onsetDateTime,
		recordedDate: conditionData.recordedDate || new Date().toISOString(),
		recorder: conditionData.recorder
			? {
					reference: conditionData.recorder,
			  }
			: undefined,
		note: conditionData.note
			? [
					{
						text: conditionData.note,
					},
			  ]
			: [],
	};
};

export const createFhirProcedure = (procedureData) => {
	return {
		resourceType: FHIR_RESOURCE_TYPES.PROCEDURE,
		id: procedureData.id || uuidv4(),
		meta: {
			lastUpdated: new Date().toISOString(),
			profile: ["http://hl7.org/fhir/StructureDefinition/Procedure"],
		},
		status: procedureData.status || FHIR_STATUS.COMPLETED,
		code: {
			coding: [
				{
					system: procedureData.codeSystem || "http://snomed.info/sct",
					code: procedureData.code || "71388002",
					display:
						procedureData.codeDisplay || procedureData.name || "Procedure",
				},
			],
			text: procedureData.name || "Procedure",
		},
		subject: {
			reference: procedureData.patientReference || "Patient/unknown",
		},
		performedDateTime:
			procedureData.performedDateTime || new Date().toISOString(),
		performer: procedureData.performer
			? [
					{
						actor: {
							reference: procedureData.performer,
						},
					},
			  ]
			: [],
		note: procedureData.note
			? [
					{
						text: procedureData.note,
					},
			  ]
			: [],
	};
};

export const createFhirMedicationRequest = (medicationData) => {
	return {
		resourceType: FHIR_RESOURCE_TYPES.MEDICATION_REQUEST,
		id: medicationData.id || uuidv4(),
		meta: {
			lastUpdated: new Date().toISOString(),
			profile: ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"],
		},
		status: medicationData.status || FHIR_STATUS.ACTIVE,
		intent: "order",
		medicationCodeableConcept: {
			coding: [
				{
					system:
						medicationData.codeSystem ||
						"http://www.nlm.nih.gov/research/umls/rxnorm",
					code: medicationData.code || "313782",
					display:
						medicationData.codeDisplay || medicationData.name || "Medication",
				},
			],
			text: medicationData.name || "Medication",
		},
		subject: {
			reference: medicationData.patientReference || "Patient/unknown",
		},
		authoredOn: medicationData.authoredOn || new Date().toISOString(),
		requester: medicationData.requester
			? {
					reference: medicationData.requester,
			  }
			: undefined,
		dosageInstruction: medicationData.dosage
			? [
					{
						text: medicationData.dosage,
						timing: medicationData.timing
							? {
									repeat: {
										frequency: medicationData.timing.frequency || 1,
										period: medicationData.timing.period || 1,
										periodUnit: medicationData.timing.periodUnit || "d",
									},
							  }
							: undefined,
					},
			  ]
			: [],
		note: medicationData.note
			? [
					{
						text: medicationData.note,
					},
			  ]
			: [],
	};
};

export const getFhirResourceDisplayName = (resource) => {
	if (!resource) return "Unknown Resource";

	switch (resource.resourceType) {
		case FHIR_RESOURCE_TYPES.OBSERVATION:
			return (
				resource.code?.coding?.[0]?.display ||
				resource.code?.text ||
				"Observation"
			);

		case FHIR_RESOURCE_TYPES.CONDITION:
			return (
				resource.code?.coding?.[0]?.display ||
				resource.code?.text ||
				"Condition"
			);

		case FHIR_RESOURCE_TYPES.PROCEDURE:
			return (
				resource.code?.coding?.[0]?.display ||
				resource.code?.text ||
				"Procedure"
			);

		case FHIR_RESOURCE_TYPES.MEDICATION_REQUEST:
			return (
				resource.medicationCodeableConcept?.coding?.[0]?.display ||
				resource.medicationCodeableConcept?.text ||
				"Medication"
			);

		default:
			return resource.resourceType || "Medical Record";
	}
};

export const getFhirResourceIcon = (resource) => {
	if (!resource) return "📋";

	switch (resource.resourceType) {
		case FHIR_RESOURCE_TYPES.OBSERVATION:
			return "📊";
		case FHIR_RESOURCE_TYPES.CONDITION:
			return "🩺";
		case FHIR_RESOURCE_TYPES.PROCEDURE:
			return "⚕️";
		case FHIR_RESOURCE_TYPES.MEDICATION_REQUEST:
			return "💊";
		case FHIR_RESOURCE_TYPES.PATIENT:
			return "👤";
		case FHIR_RESOURCE_TYPES.ENCOUNTER:
			return "🏥";
		case FHIR_RESOURCE_TYPES.DIAGNOSTIC_REPORT:
			return "📋";
		case FHIR_RESOURCE_TYPES.ALLERGY_INTOLERANCE:
			return "⚠️";
		case FHIR_RESOURCE_TYPES.IMMUNIZATION:
			return "💉";
		default:
			return "📄";
	}
};

export const formatFhirDate = (dateString) => {
	if (!dateString) return "Unknown date";

	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch (error) {
		return dateString;
	}
};

export const getFhirResourceStatusColor = (resource) => {
	if (!resource) return "gray";

	const status =
		resource.status || resource.clinicalStatus?.coding?.[0]?.code || "unknown";

	switch (status.toLowerCase()) {
		case "active":
		case "final":
		case "completed":
			return "green";
		case "in-progress":
		case "preliminary":
			return "blue";
		case "cancelled":
		case "inactive":
			return "red";
		case "resolved":
			return "gray";
		default:
			return "gray";
	}
};

export const generateSampleFhirData = () => {
	return [
		createFhirObservation({
			id: "obs-001",
			name: "Blood Pressure",
			valueString: "120/80 mmHg",
			effectiveDateTime: "2024-06-20T10:30:00Z",
			note: "Normal blood pressure reading",
			category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
		}),
		createFhirCondition({
			id: "cond-001",
			name: "Hypertension",
			onsetDateTime: "2024-01-15T00:00:00Z",
			note: "Essential hypertension, well controlled",
			clinicalStatus: FHIR_STATUS.ACTIVE,
		}),
		createFhirProcedure({
			id: "proc-001",
			name: "Annual Physical Examination",
			performedDateTime: "2024-06-20T09:00:00Z",
			note: "Routine annual physical examination",
			status: FHIR_STATUS.COMPLETED,
		}),
		createFhirMedicationRequest({
			id: "med-001",
			name: "Lisinopril 10mg",
			authoredOn: "2024-06-20T11:00:00Z",
			dosage: "Take one tablet daily",
			note: "For blood pressure control",
		}),
		createFhirObservation({
			id: "obs-002",
			name: "Body Weight",
			valueQuantity: { value: 75, unit: "kg" },
			effectiveDateTime: "2024-06-20T10:15:00Z",
			category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
		}),
	];
};

export const getMockFhirData = () => {
	return {
		observations: [
			{
				id: "obs-001",
				resourceType: "Observation",
				status: "final",
				code: {
					coding: [
						{
							system: "http://loinc.org",
							code: "85354-9",
							display: "Blood pressure panel with all children optional",
						},
					],
					text: "Blood Pressure",
				},
				valueQuantity: {
					value: "120/80",
					unit: "mmHg",
				},
				effectiveDateTime: "2024-01-15T10:30:00Z",
				interpretation: [
					{
						coding: [
							{
								code: "N",
								display: "Normal",
							},
						],
						text: "Normal",
					},
				],
			},
			{
				id: "obs-002",
				resourceType: "Observation",
				status: "final",
				code: {
					coding: [
						{
							system: "http://loinc.org",
							code: "33747-0",
							display: "General blood chemistry panel",
						},
					],
					text: "Blood Chemistry Panel",
				},
				valueQuantity: {
					value: 95,
					unit: "mg/dL",
				},
				effectiveDateTime: "2024-01-10T09:15:00Z",
				interpretation: [
					{
						text: "Normal glucose level",
					},
				],
			},
			{
				id: "obs-003",
				resourceType: "Observation",
				status: "final",
				code: {
					text: "Body Weight",
				},
				valueQuantity: {
					value: 75,
					unit: "kg",
				},
				effectiveDateTime: "2024-01-15T10:00:00Z",
			},
		],
		conditions: [
			{
				id: "cond-001",
				resourceType: "Condition",
				clinicalStatus: {
					coding: [
						{
							system:
								"http://terminology.hl7.org/CodeSystem/condition-clinical",
							code: "active",
							display: "Active",
						},
					],
				},
				code: {
					coding: [
						{
							system: "http://snomed.info/sct",
							code: "38341003",
							display: "Hypertension",
						},
					],
					text: "Essential Hypertension",
				},
				onsetDateTime: "2023-06-15T00:00:00Z",
				severity: {
					coding: [
						{
							code: "mild",
							display: "Mild",
						},
					],
				},
				note: [
					{
						text: "Patient responds well to ACE inhibitor therapy",
					},
				],
			},
			{
				id: "cond-002",
				resourceType: "Condition",
				clinicalStatus: {
					coding: [
						{
							code: "resolved",
							display: "Resolved",
						},
					],
				},
				code: {
					text: "Type 2 Diabetes Mellitus",
				},
				onsetDateTime: "2022-03-20T00:00:00Z",
				severity: {
					coding: [
						{
							code: "moderate",
							display: "Moderate",
						},
					],
				},
			},
		],
		procedures: [
			{
				id: "proc-001",
				resourceType: "Procedure",
				status: "completed",
				code: {
					coding: [
						{
							system: "http://snomed.info/sct",
							code: "185349003",
							display: "Encounter for check up",
						},
					],
					text: "Annual Physical Examination",
				},
				performedDateTime: "2024-01-15T09:00:00Z",
				bodySite: [
					{
						text: "Whole body",
					},
				],
				outcome: {
					text: "Patient in good overall health",
				},
			},
			{
				id: "proc-002",
				resourceType: "Procedure",
				status: "completed",
				code: {
					text: "Colonoscopy",
				},
				performedDateTime: "2023-11-20T14:00:00Z",
				bodySite: [
					{
						text: "Colon",
					},
				],
				outcome: {
					text: "No abnormalities detected",
				},
			},
		],
		medications: [
			{
				id: "med-001",
				resourceType: "MedicationStatement",
				status: "active",
				medicationCodeableConcept: {
					coding: [
						{
							system: "http://www.nlm.nih.gov/research/umls/rxnorm",
							code: "314076",
							display: "Lisinopril 10 MG Oral Tablet",
						},
					],
					text: "Lisinopril 10mg",
				},
				effectivePeriod: {
					start: "2023-06-15T00:00:00Z",
				},
				dosage: [
					{
						text: "Take one tablet daily in the morning",
					},
				],
				reasonReference: [
					{
						display: "Essential Hypertension",
					},
				],
			},
			{
				id: "med-002",
				resourceType: "MedicationStatement",
				status: "stopped",
				medicationCodeableConcept: {
					text: "Metformin 500mg",
				},
				effectivePeriod: {
					start: "2022-03-20T00:00:00Z",
					end: "2023-08-10T00:00:00Z",
				},
				dosage: [
					{
						text: "Take one tablet twice daily with meals",
					},
				],
				reasonReference: [
					{
						display: "Type 2 Diabetes Mellitus",
					},
				],
			},
		],
		allergies: [
			{
				id: "allergy-001",
				resourceType: "AllergyIntolerance",
				clinicalStatus: {
					coding: [
						{
							code: "active",
							display: "Active",
						},
					],
				},
				type: "allergy",
				category: ["medication"],
				criticality: "high",
				code: {
					coding: [
						{
							system: "http://www.nlm.nih.gov/research/umls/rxnorm",
							code: "7984",
							display: "Penicillin",
						},
					],
					text: "Penicillin",
				},
				onsetDateTime: "2010-05-15T00:00:00Z",
				reaction: [
					{
						manifestation: [
							{
								coding: [
									{
										code: "271807003",
										display: "Skin rash",
									},
								],
								text: "Skin rash",
							},
						],
						severity: "moderate",
					},
				],
			},
			{
				id: "allergy-002",
				resourceType: "AllergyIntolerance",
				clinicalStatus: {
					coding: [
						{
							code: "active",
							display: "Active",
						},
					],
				},
				type: "allergy",
				category: ["food"],
				criticality: "low",
				code: {
					text: "Shellfish",
				},
				onsetDateTime: "2015-08-20T00:00:00Z",
				reaction: [
					{
						manifestation: [
							{
								text: "Mild stomach upset",
							},
						],
						severity: "mild",
					},
				],
			},
		],
	};
};
