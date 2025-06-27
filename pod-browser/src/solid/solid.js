import { QueryEngine } from "@comunica/query-sparql";
import { getFile, overwriteFile } from "@inrupt/solid-client";
import { Store } from "n3";
import { graph } from "rdflib";
import SPARQLQueries from "./SPARQLQueries";

export async function getPatientData(session, routeDataset) {
	if (session == null) {
		throw new Error("Session could not be found.");
	}

	let webId = session.info.webId.split("profile")[0];

	let patientData = await fetchFileContent(session, webId + "/" + routeDataset);

	let patientDataGraph = graph();

	for (let line of patientData.split("\n")) {
		if (line.trim() === "") continue;
		if (line.startsWith("#")) continue;
		if (line.startsWith("@prefix")) continue;
		let parsedLine = parseRDFLine(line);
		parsedLine.subject = parsedLine.subject.replace(/<|>/g, "");
		parsedLine.predicate = parsedLine.predicate.replace(/<|>/g, "");
		parsedLine.object = parsedLine.object.replace(/<|>|"/g, "");
		parsedLine.object = parsedLine.object.split("^^")[0];
		let object = parsedLine.object;
		if (isUri(object)) {
			object = patientDataGraph.sym(object);
		}
		patientDataGraph.add(
			parsedLine.subject,
			patientDataGraph.sym(parsedLine.predicate),
			object
		);
	}

	let patient = await getPatient(patientDataGraph);

	patient.procedures = await getProcedures(patientDataGraph);
	patient.allergies = await getAllergies(patientDataGraph);

	return patient;
}

export async function addCoding(
	session,
	routeDataset,
	targetCoding,
	newCoding
) {
	if (session == null) {
		throw new Error("Session could not be found.");
	}

	let webId = session.info.webId?.split("profile")[0];

	let patientData = await fetchFileContent(session, webId + routeDataset);

	let patientDataGraph = graph();

	for (let line of patientData.split("\n")) {
		if (line.trim() === "") continue;
		if (line.startsWith("#")) continue;
		if (line.startsWith("@prefix")) continue;
		let parsedLine = parseRDFLine(line);
		parsedLine.subject = parsedLine.subject.replace(/<|>/g, "");
		parsedLine.predicate = parsedLine.predicate.replace(/<|>/g, "");
		parsedLine.object = parsedLine.object.replace(/<|>|"/g, "");
		parsedLine.object = parsedLine.object.split("^^")[0];
		let object = parsedLine.object;
		if (isUri(object)) {
			object = patientDataGraph.sym(object);
		}
		patientDataGraph.add(
			parsedLine.subject,
			patientDataGraph.sym(parsedLine.predicate),
			object
		);
	}

	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.findCodeableConcept(targetCoding.code, targetCoding.system),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	let codeableConcept = await getCodeableConcept(bindings, targetCoding.code);

	patientDataGraph.add(
		codeableConcept,
		patientDataGraph.sym("http://hl7.org/fhir/coding"),
		patientDataGraph.sym("http://example.com/coding/" + newCoding.code)
	);

	patientDataGraph.add(
		patientDataGraph.sym("http://example.com/coding/" + newCoding.code),
		patientDataGraph.sym("http://hl7.org/fhir/code"),
		newCoding.code
	);

	patientDataGraph.add(
		patientDataGraph.sym("http://example.com/coding/" + newCoding.code),
		patientDataGraph.sym("http://hl7.org/fhir/system"),
		newCoding.system
	);

	patientDataGraph.add(
		patientDataGraph.sym("http://example.com/coding/" + newCoding.code),
		patientDataGraph.sym("http://hl7.org/fhir/display"),
		newCoding.display
	);

	patientData = patientDataGraph.toString().slice(1, -1);

	await uploadFile(session, patientData, "text/turtle", routeDataset);
}

async function uploadFile(session, content, contentType, route) {
	let webId = session.info.webId?.split("profile")[0];

	if (webId == undefined) {
		throw new Error("WebId cannot be undefined.");
	}

	let finalRoute = webId + route;
	let file = new Blob([content], { type: contentType });

	try {
		await overwriteFile(finalRoute, file, { fetch: session.fetch });
	} catch (e) {
		console.error(e);
	}
}

async function getCodeableConcept(bindings, searchCode) {
	return new Promise((resolve, reject) => {
		let codeableConcept = null;
		bindings.on("data", async (binding) => {
			let code = binding.get("code").value;
			if (code === searchCode) {
				codeableConcept = binding.get("codeable").id;
			}
		});

		bindings.on("end", () => {
			resolve(codeableConcept);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getPatient(patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(SPARQLQueries.getPatient(), {
		sources: [convertGraphToN3Store(patientDataGraph)],
	});

	return new Promise((resolve, reject) => {
		let patient = {};

		bindings.on("data", async (binding) => {
			let node = binding.get("patient").id;
			patient.gender = binding.get("gender").value;
			patient.birthDate = binding.get("birthDate").value;
			patient.fullName = binding.get("fullName").value;
			patient.telecoms = await getTelecomFor(patientDataGraph, node);
		});

		bindings.on("end", () => {
			resolve(patient);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getTelecomFor(patientDataGraph, node) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.getTelecomFor(node),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	return new Promise((resolve, reject) => {
		let telecoms = [];

		bindings.on("data", (binding) => {
			let telecom = {
				system: binding.get("system").value,
				value: binding.get("value").value,
			};
			if (binding.has("telecomUse")) {
				telecom.use = binding.get("use").value;
			}
			telecoms.push(telecom);
		});

		bindings.on("end", () => {
			resolve(telecoms);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getProcedures(patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.getProcedures(),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	return new Promise((resolve, reject) => {
		let procedures = [];

		bindings.on("data", async (binding) => {
			let procedure = {
				status: binding.get("status").value,
				occurrenceDateTime: binding.get("date").value,
				code: await getCodeableConceptFor(
					binding.get("i").id,
					"code",
					patientDataGraph
				),
				bodySite: await getCodeableConceptArrayFor(
					binding.get("i").id,
					"bodySite",
					patientDataGraph
				),
			};
			procedures.push(procedure);
		});

		bindings.on("end", () => {
			resolve(procedures);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getAllergies(patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(SPARQLQueries.getAllergies(), {
		sources: [convertGraphToN3Store(patientDataGraph)],
	});

	return new Promise((resolve, reject) => {
		let allergies = [];

		bindings.on("data", async (binding) => {
			let node = binding.get("a").id;
			let allergy = {};
			allergy.criticality = binding.get("criticality").value;
			allergy.recordedDate = binding.get("recordedDate").value;
			allergy.code = await getCodeableConceptFor(
				node,
				"code",
				patientDataGraph
			);
			allergy.clinicalStatus = await getCodeableConceptArrayFor(
				node,
				"clinicalStatus",
				patientDataGraph
			);
			allergies.push(allergy);
		});

		bindings.on("end", () => {
			resolve(allergies);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getCodeableConceptFor(node, predicate, patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.getCodeableConceptFor(node, predicate),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	return new Promise((resolve, reject) => {
		let codeableConcept = {};

		bindings.on("data", async (binding) => {
			let node = binding.get("codeable").id;
			codeableConcept.text = binding.get("text").value;
			codeableConcept.codings = await getCodingFor(node, patientDataGraph);
		});

		bindings.on("end", () => {
			resolve(codeableConcept);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getCodeableConceptArrayFor(node, predicate, patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.getCodeableConceptFor(node, predicate),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	return new Promise((resolve, reject) => {
		let codeableConcepts = [];

		bindings.on("data", async (binding) => {
			let node = binding.get("codeable").id;
			codeableConcepts.push({
				text: binding.get("text").value,
				codings: await getCodingFor(node, patientDataGraph),
			});
		});

		bindings.on("end", () => {
			resolve(codeableConcepts);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function getCodingFor(node, patientDataGraph) {
	let queryEngine = new QueryEngine();
	let bindings = await queryEngine.queryBindings(
		SPARQLQueries.getCodingFor(node),
		{
			sources: [convertGraphToN3Store(patientDataGraph)],
		}
	);

	return new Promise((resolve, reject) => {
		let codeableConcepts = [];

		bindings.on("data", (binding) => {
			codeableConcepts.push({
				code: binding.get("code").value,
				system: binding.get("system").value,
				display: binding.get("display").value,
			});
		});

		bindings.on("end", () => {
			resolve(codeableConcepts);
		});

		bindings.on("error", (error) => {
			reject(error);
		});
	});
}

async function fetchFileContent(session, resource) {
	if (session == null) {
		throw new Error("Session could not be found.");
	}

	let webId = session.info.webId;

	if (webId == undefined) {
		throw new Error("WebId cannot be undefined.");
	}

	let file = await getFile(resource, { fetch: session.fetch });

	return await file.text();
}

function isUri(value) {
	try {
		new URL(value);
		return true;
	} catch (e) {
		return false;
	}
}

function parseRDFLine(line) {
	const parts = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
			inQuotes = !inQuotes;
			current += char;
		} else if (char === " " && !inQuotes) {
			if (current.trim()) {
				parts.push(current.trim());
				current = "";
			}
		} else {
			current += char;
		}

		i++;
	}
	if (current.trim()) {
		parts.push(current.trim());
	}

	if (parts.length > 0 && parts[parts.length - 1].endsWith(".")) {
		parts[parts.length - 1] = parts[parts.length - 1].slice(0, -1);
	}

	return {
		subject: parts[0] || "",
		predicate: parts[1] || "",
		object: parts[2] || "",
	};
}

function convertGraphToN3Store(graph) {
	const n3Store = new Store();
	graph.statements.forEach((statement) => {
		n3Store.addQuad(
			statement.subject.value,
			statement.predicate.value,
			statement.object.value
		);
	});
	return n3Store;
}
