import { QueryEngine } from "@comunica/query-sparql";
import { getFile, overwriteFile } from "@inrupt/solid-client";
import { getSessionFromStorage } from "@inrupt/solid-client-authn-node";
import fs from "fs";
import { Store } from "n3";
import path from "path";
import { graph } from "rdflib";
import AllergyCatalogRepository from "../repositories/AllergyCatalogRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import PatientProcedureRepository from "../repositories/PatientProcedureRepository.js";
import PatientRepository from "../repositories/PatientRepository.js";
import ProcedureCatalogRepository from "../repositories/ProcedureCatalogRepository.js";
import ExportLoggerService from "./ExportLoggerService.js";
import EntityToRDF from "./rdf/EntityToRDF.js";
import SPARQLQueries from "./rdf/SPARQLQueries.js";
import ShapeMapGenerator from "./ShapeMapGenerator.js";

class SolidService {
	async exportUserData(
		sessionId,
		patientId,
		routeDataset,
		routeShape,
		routeShapeMap
	) {
		let startTime;
		let exportStatus = "error";
		let patientsCount = 0;
		let proceduresCount = 0;
		let allergiesCount = 0;

		try {
			let session = await getSessionFromStorage(sessionId);

			if (session == null) {
				throw new Error("Session could not be found.");
			}

			let webId = session.info.webId?.split("profile")[0];

			if (webId == undefined) {
				throw new Error("WebId cannot be undefined.");
			}

			let patient = await PatientRepository.findById(patientId);
			let procedures = await PatientProcedureRepository.findByPatientId(
				patientId
			);
			let allergies = await PatientAllergyRepository.findByPatientId(patientId);

			patientsCount = patient ? 1 : 0;
			proceduresCount = procedures ? procedures.length : 0;
			allergiesCount = allergies ? allergies.length : 0;
			let patientData = await EntityToRDF.convertPatient(patient);

			for (let procedure of procedures) {
				patientData.addAll(
					(await EntityToRDF.convertProcedure(procedure)).statements
				);
			}

			for (let allergy of allergies) {
				patientData.addAll(
					(await EntityToRDF.convertAllergy(allergy)).statements
				);
			}

			let shapeMap = ShapeMapGenerator.generateShapeMap(
				patientData,
				patient._id
			);

			let shape = fs.readFileSync(
				path.resolve(path.dirname(""), "src/resources/shape.shex"),
				{ encoding: "utf-8" }
			);

			patientData = patientData.toString().slice(1, -1);

			startTime = Date.now();

			await this.uploadFile(
				sessionId,
				patientData,
				"text/turtle",
				routeDataset
			);
			await this.uploadFile(sessionId, shapeMap, "text/shex", routeShapeMap);
			await this.uploadFile(
				sessionId,
				shape,
				"text/shex",
				routeShape + "-" + patientId
			);

			exportStatus = "success";
		} catch (error) {
			console.error("Error during export:", error);
			exportStatus = "error";
			throw error;
		} finally {
			const endTime = Date.now();
			const duration = endTime - startTime;

			ExportLoggerService.logExport({
				proceduresCount,
				allergiesCount,
				duration,
			});
		}
	}

	async importUserData(
		sessionId,
		patientId,
		routeDataset,
		routeShape,
		routeShapeMap
	) {
		let session = await getSessionFromStorage(sessionId);

		if (session == null) {
			throw new Error("Session could not be found.");
		}

		let webId = session.info.webId?.split("profile")[0];

		if (webId == undefined) {
			throw new Error("WebId cannot be undefined.");
		}

		let patient = await PatientRepository.findById(patientId);
		if (!patient) {
			throw new Error("Patient not found");
		}

		let patientData = await this.fetchFileContent(
			sessionId,
			webId + routeDataset
		);

		let shape = await this.fetchFileContent(sessionId, webId + routeShape);
		let shapeMap = await this.fetchFileContent(
			sessionId,
			webId + routeShapeMap
		);

		let patientDataGraph = graph();

		for (let line of patientData.split("\n")) {
			if (line.trim() === "") continue;
			let parsedLine = this.parseRDFLine(line);
			parsedLine.subject = parsedLine.subject.replace(/<|>/g, "");
			parsedLine.predicate = parsedLine.predicate.replace(/<|>/g, "");
			parsedLine.object = parsedLine.object.replace(/<|>|"/g, "");
			parsedLine.object = parsedLine.object.split("^^")[0];
			let object = parsedLine.object;
			if (this.isUri(object)) {
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
			SPARQLQueries.getProcedures(),
			{
				sources: [this.convertGraphToN3Store(patientDataGraph)],
			}
		);

		bindings.on("data", async (binding) => {
			let procedure = {};
			let node = binding.get("i").value;
			procedure.status = binding.get("status").value;
			let performedDate = binding.get("date").value;
			if (procedure.status === "completed") {
				procedure.performedDateTime = new Date(performedDate).toISOString();
			} else {
				procedure.scheduledDateTime = new Date(performedDate).toISOString();
			}

			let procedureCode = await this.getCodeForNode(
				node,
				"code",
				"http://snomed.info/sct",
				patientDataGraph
			);

			let procedureType = await ProcedureCatalogRepository.findOne({
				"code.coding": {
					$elemMatch: {
						code: procedureCode,
					},
				},
			});

			if (!procedureType) {
				return;
			}

			procedure.procedure = procedureType._id;
			procedure.patient = patient._id;

			if (!(await PatientProcedureRepository.findOne(procedure))) {
				procedure.doctor = null;
				await PatientProcedureRepository.create(procedure);
			}
		});

		bindings = await queryEngine.queryBindings(SPARQLQueries.getAllergies(), {
			sources: [this.convertGraphToN3Store(patientDataGraph)],
		});

		bindings.on("data", async (binding) => {
			let allergy = {};
			let node = binding.get("a").value;
			allergy.recordedDate = binding.get("recordedDate").value;
			allergy.criticality = binding.get("criticality").value;

			let code = await this.getCodeForNode(
				node,
				"code",
				"http://snomed.info/sct",
				patientDataGraph
			);

			let allergyType = await AllergyCatalogRepository.findOne({
				"code.coding": {
					$elemMatch: {
						code: code,
						system: "http://snomed.info/sct",
					},
				},
			});

			if (!allergyType) {
				return;
			}

			allergy.allergy = allergyType._id;

			let status = await this.getCodeForNode(
				node,
				"clinicalStatus",
				"http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
				patientDataGraph
			);

			allergy.clinicalStatus = {
				coding: [
					{
						system:
							"http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
						code: status,
						display: status.charAt(0).toUpperCase() + status.slice(1),
					},
				],
			};
			allergy.patient = patient._id;

			if (await PatientAllergyRepository.findOne(allergy)) {
				return;
			}

			PatientAllergyRepository.create(allergy);
		});
	}

	async getCodeForNode(node, predicate, system, patientDataGraph) {
		let queryEngine = new QueryEngine();
		let bindings = await queryEngine.queryBindings(
			SPARQLQueries.getCodeForNode(node, predicate, system),
			{
				sources: [this.convertGraphToN3Store(patientDataGraph)],
			}
		);

		return new Promise((resolve, reject) => {
			let code = null;

			bindings.on("data", async (binding) => {
				code = binding.get("code").value;
			});

			bindings.on("end", () => {
				resolve(code);
			});

			bindings.on("error", (error) => {
				reject(error);
			});
		});
	}

	async fetchFileContent(sessionId, resource) {
		let session = await getSessionFromStorage(sessionId);

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

	parseRDFLine(line) {
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

	convertGraphToN3Store(graph) {
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

	async fetchFile(sessionId, resource) {
		let session = await getSessionFromStorage(sessionId);

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

	async uploadFile(sessionId, content, contentType, route) {
		let session = await getSessionFromStorage(sessionId);

		if (session == null) {
			throw new Error("Session could not be found.");
		}

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

	async exportLoadTestData(
		sessionId,
		testData,
		testNumber,
		totalTests,
		pathConfig = {}
	) {
		try {
			const session = await getSessionFromStorage(sessionId);
			if (!session || !session.info.isLoggedIn) {
				throw new Error("Session not found or user not logged in");
			}

			const startTime = Date.now();
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const baseFileName = `${
				pathConfig.filePrefix || "test"
			}-${testNumber}-of-${totalTests}-${timestamp}`;
			const basePath = pathConfig.baseFolder || "load-tests";
			const subPath = pathConfig.subfolder || "hospital";
			const baseUrl = `${session.info.webId.replace(
				"/profile/card#me",
				""
			)}/${basePath}/${subPath}`;

			const dataFileUrl = `${baseUrl}/${baseFileName}.ttl`;
			const ntriplesContent = testData.triples.join("\n");
			const dataBlob = new Blob([ntriplesContent], {
				type: "application/n-triples",
			});

			await overwriteFile(dataFileUrl, dataBlob, {
				contentType: "application/n-triples",
				fetch: session.fetch,
			});

			const totalUploadTime = Date.now() - startTime;

			return {
				success: true,
				files: {
					data: {
						url: dataFileUrl,
						uploadTime: totalUploadTime,
						size: ntriplesContent.length,
						triplesCount: testData.triples.length,
					},
				},
				totalUploadTime,
				testNumber,
				totalTests,
				pathUsed: `${basePath}/${subPath}/${baseFileName}`,
			};
		} catch (error) {
			console.error("Error exporting load test data to Solid:", error);
			throw new Error(`Failed to export load test data: ${error.message}`);
		}
	}

	async getSolidServerFromSession(sessionId) {
		try {
			const session = await getSessionFromStorage(sessionId);
			if (!session || !session.info.isLoggedIn) {
				throw new Error("Session not found or user not logged in");
			}

			const webId = session.info.webId;
			if (!webId) {
				throw new Error("WebId not found in session");
			}

			const url = new URL(webId);
			const hostname = url.hostname;

			let solidServer;

			const parts = hostname.split(".");
			if (parts.length >= 3) {
				const knownProviders = [
					"solidweb.org",
					"solidcommunity.net",
					"inrupt.net",
				];
				const possibleProvider = parts.slice(1).join(".");

				if (knownProviders.includes(possibleProvider)) {
					solidServer = `${url.protocol}//${possibleProvider}`;
				} else {
					solidServer = `${url.protocol}//${hostname}`;
				}
			} else {
				solidServer = `${url.protocol}//${hostname}`;
			}

			return solidServer;
		} catch (error) {
			console.error("Error getting Solid server from session:", error);
			throw error;
		}
	}
	isUri(value) {
		try {
			new URL(value);
			return true;
		} catch (e) {
			return false;
		}
	}
}

export default new SolidService();
