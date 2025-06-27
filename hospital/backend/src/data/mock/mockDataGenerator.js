const subjects = [
	"<http://hospital.health/patient/001>",
	"<http://hospital.health/patient/002>",
	"<http://hospital.health/doctor/001>",
	"<http://hospital.health/doctor/002>",
	"<http://hospital.health/procedure/001>",
	"<http://hospital.health/appointment/001>",
	"<http://hospital.health/hospital/001>",
	"<http://hospital.health/record/001>",
];

const predicates = [
	"<http://hospital.health/ontology/hasName>",
	"<http://hospital.health/ontology/hasProcedure>",
	"<http://hospital.health/ontology/hasAppointment>",
	"<http://hospital.health/ontology/treatedBy>",
	"<http://hospital.health/ontology/scheduledFor>",
	"<http://hospital.health/ontology/hasAge>",
	"<http://hospital.health/ontology/hasSpecialty>",
	"<http://hospital.health/ontology/hasStatus>",
	"<http://hospital.health/ontology/belongsTo>",
	"<http://hospital.health/ontology/hasDate>",
];

const objects = [
	'"Ana García"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Luis Martínez"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Cirugía cardíaca"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Consulta general"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Radiología"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"45"^^<http://www.w3.org/2001/XMLSchema#integer>',
	'"67"^^<http://www.w3.org/2001/XMLSchema#integer>',
	'"Cardiología"^^<http://www.w3.org/2001/XMLSchema#string>',
	'"Medicina interna"^^<http://www.w3.org/2001/XMLSchema#string>',
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
			type: "hospital_load_test",
			vocabulary: "healthcare_rdf",
			format: "n-triples",
			subjects: subjects.length,
			predicates: predicates.length,
			objects: objects.length,
			generatedAt: new Date().toISOString(),
		},
	};
}

export { generateLoadTestData };
