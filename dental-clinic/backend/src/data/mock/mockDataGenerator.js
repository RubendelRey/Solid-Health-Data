const subjects = [
	"<http://dental.clinic/patient/001>",
	"<http://dental.clinic/patient/002>",
	"<http://dental.clinic/dentist/001>",
	"<http://dental.clinic/dentist/002>",
	"<http://dental.clinic/treatment/001>",
	"<http://dental.clinic/appointment/001>",
	"<http://dental.clinic/clinic/001>",
	"<http://dental.clinic/record/001>",
];

const predicates = [
	"<http://dental.clinic/ontology/hasName>",
	"<http://dental.clinic/ontology/hasTreatment>",
	"<http://dental.clinic/ontology/hasAppointment>",
	"<http://dental.clinic/ontology/treatedBy>",
	"<http://dental.clinic/ontology/scheduledFor>",
	"<http://dental.clinic/ontology/hasAge>",
	"<http://dental.clinic/ontology/hasSpecialty>",
	"<http://dental.clinic/ontology/hasStatus>",
	"<http://dental.clinic/ontology/belongsTo>",
	"<http://dental.clinic/ontology/hasDate>",
];

const objects = [
	'"Juan Perez"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Maria Garcia"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Limpieza dental"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Ortodoncia"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Endodoncia"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"35"^^<http://www.w3.org/2001/XMLSchema#integer>',
	'"42"^^<http://www.w3.org/2001/XMLSchema#integer>',
	'"Odontologia general"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Cirugia oral"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Activo"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Completado"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"2024-12-20"^^<http://www.w3.org/2001/XMLSchema#date>',
];

function generateTriple() {
	const subject = subjects[Math.floor(Math.random() * subjects.length)];
	const predicate = predicates[Math.floor(Math.random() * predicates.length)];
	const object = objects[Math.floor(Math.random() * objects.length)];

	return `${subject} ${predicate} ${object} .`;
}

function generateTriples(count) {
	const triples = [];
	for (let i = 0; i < count; i++) {
		triples.push(generateTriple());
	}
	return triples;
}

function generateLoadTestData(triplesCount) {
	const triples = generateTriples(triplesCount);

	return {
		triples,
		count: triples.length,
		metadata: {
			type: "dental_clinic_load_test",
			vocabulary: "dental_healthcare_rdf",
			format: "n-triples",
			subjects: subjects.length,
			predicates: predicates.length,
			objects: objects.length,
			generatedAt: new Date().toISOString(),
		},
	};
}

export { generateLoadTestData, generateTriple, generateTriples };
