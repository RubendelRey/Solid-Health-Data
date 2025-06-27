import {
	Session,
	getSessionFromStorage,
} from "@inrupt/solid-client-authn-node";
import fs from "fs";
import path from "path";

import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import {
	getFile,
	getSolidDataset,
	getThing,
	overwriteFile,
} from "@inrupt/solid-client";
import { Store } from "n3";
import { graph } from "rdflib";
import AllergyCatalogueRepository from "../repositories/AllergyCatalogueRepository.js";
import InterventionRepository from "../repositories/InterventionRepository.js";
import InterventionTypeRepository from "../repositories/InterventionTypeRepository.js";
import PatientAllergyRepository from "../repositories/PatientAllergyRepository.js";
import Environment from "../utils/Environment.js";
import ExportLoggerService from "./ExportLoggerService.js";
import InterventionService from "./InterventionService.js";
import PatientAllergyService from "./PatientAllergyService.js";
import PatientService from "./PatientService.js";
import { ADAService } from "./rdf/AdaService.js";
import { EntityToRDF } from "./rdf/EntityToRDF.js";
import ShapeMapGenerator from "./rdf/ShapeMapGenerator.js";
import { SnomedService } from "./rdf/SnomedService.js";
import SPARQLQueries from "./rdf/SPARQLQueries.js";

class SolidService {
	clientName = "dental-clinic";
	redirectUrl = `https://${Environment.getBackendHost()}:${Environment.getBackendPort()}/api/solid/login/success`;

	async login(podProvider, req, res) {
		const session = new Session();
		req.session.solidSessionId = session.info.sessionId;
		await session.login({
			oidcIssuer: podProvider,
			redirectUrl: this.redirectUrl,
			clientName: this.clientName,
			handleRedirect: (url) => {
				res.redirect(url);
			},
		});
	}

	async successfulLogin(req, res) {
		let sessionId = req.session.solidSessionId;
		let solidSession = await getSessionFromStorage(sessionId);

		let redirectUrl = `https://${Environment.getBackendHost()}:${Environment.getBackendPort()}/api/solid${
			req.url
		}`;

		await solidSession.handleIncomingRedirect(redirectUrl.toString());
		res.redirect(
			`https://${Environment.getFrontendHost()}:${Environment.getFrontendPort()}/data-export`
		);
	}

	async getProfile(sessionId) {
		let session = await getSessionFromStorage(sessionId);

		if (!session || !session.info.isLoggedIn) {
			throw new Error("User is not logged in");
		}

		let webId = session.info.webId;

		if (webId == undefined) {
			throw new Error("WebId cannot be undefined.");
		}

		let myDataset = await getSolidDataset(webId, {
			fetch: session.fetch,
		});
		const profile = getThing(myDataset, webId);
		return profile;
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
		let interventionsCount = 0;
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

			let patient = await PatientService.getPatientById(patientId);
			if (!patient) {
				throw new Error("Patient not found");
			}

			let interventions = await InterventionService.getPatientInterventions(
				patientId
			);
			let allergies = await PatientAllergyService.getPatientAllergies(
				patientId
			);

			patientsCount = patient ? 1 : 0;
			proceduresCount = interventions?.interventions
				? interventions.interventions.length
				: 0;
			interventionsCount = interventions?.interventions
				? interventions.interventions.length
				: 0;
			allergiesCount = allergies?.allergies ? allergies.allergies.length : 0;

			let patientData = graph();

			patientData.addAll(
				(await EntityToRDF.convertPatient(patient._id)).statements
			);

			for (let intervention of interventions.interventions) {
				patientData.addAll(
					(await EntityToRDF.convertIntervention(intervention)).statements
				);
			}

			for (let allergy of allergies.allergies) {
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
			await this.uploadFile(sessionId, shape, "text/shex", routeShape);
			await this.uploadFile(sessionId, shapeMap, "text/shex", routeShapeMap);

			exportStatus = "success";
			return true;
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

		let patient = await PatientService.getPatientById(patientId);
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

		let interventions = await this.importInterventions(
			patientDataGraph,
			patient
		);
		let allergies = await this.importAllergies(patientDataGraph, patient);

		return {
			interventionCont: interventions.length,
			allergyCount: allergies.length,
		};
	}

	async importInterventions(patientDataGraph, patient) {
		let queryEngine = new QueryEngine();
		let bindings = await queryEngine.queryBindings(
			SPARQLQueries.getInterventions(),
			{
				sources: [this.convertGraphToN3Store(patientDataGraph)],
			}
		);

		return new Promise((resolve, reject) => {
			let interventions = [];

			bindings.on("data", async (binding) => {
				let intervention = {};
				let node = binding.get("i").value;

				intervention.state = EntityToRDF.convertStatus(
					binding.get("status").value
				);

				intervention.date = new Date(binding.get("date").value);

				let interventionTypeCode = await this.getCodeForNode(
					node,
					"code",
					"https://www.ada.org/snodent",
					patientDataGraph
				);

				if (!interventionTypeCode) {
					return;
				}

				let interventionName = await ADAService.getName(interventionTypeCode);

				if (!interventionName) {
					return;
				}

				let interventionType = await InterventionTypeRepository.findByName(
					interventionName
				);

				if (!interventionType) {
					return;
				}

				intervention.patient = patient._id;
				intervention.interventionType = interventionType._id;

				if (await InterventionRepository.findOne(intervention)) {
					return;
				}

				let teethAffected = await this.getCodeArrayForNode(
					node,
					"bodySite",
					"https://www.fdiworldental.org",
					patientDataGraph
				);

				intervention.teethAffected = teethAffected;
				intervention.doctor = null;

				await InterventionRepository.create(intervention);
				interventions.push(intervention);
			});

			bindings.on("end", () => {
				resolve(interventions);
			});

			bindings.on("error", (error) => {
				reject(error);
			});
		});
	}

	async importAllergies(patientDataGraph, patient) {
		let queryEngine = new QueryEngine();
		let bindings = await queryEngine.queryBindings(
			SPARQLQueries.getAllergies(),
			{
				sources: [this.convertGraphToN3Store(patientDataGraph)],
			}
		);

		return new Promise((resolve, reject) => {
			let allergies = [];

			bindings.on("data", async (binding) => {
				let allergy = {};
				let node = binding.get("a").value;

				allergy.detectionDate = new Date(binding.get("recordedDate").value);
				allergy.severity = binding.get("criticality").value;

				let code = await this.getCodeForNode(
					node,
					"code",
					"http://snomed.info/sct",
					patientDataGraph
				);

				if (!code) {
					return;
				}

				let allergyCode = await SnomedService.getCode(code);

				if (!allergyCode) {
					return;
				}

				let allergyType = await AllergyCatalogueRepository.findByCode(
					allergyCode
				);

				if (!allergyType) {
					return;
				}

				allergy.allergyId = allergyType._id;

				let status = await this.getCodeForNode(
					node,
					"clinicalStatus",
					"http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
					patientDataGraph
				);

				allergy.status = status;

				allergy.patientId = patient._id;

				let find = await PatientAllergyRepository.findOne(allergy);

				if (find) {
					return;
				}

				await PatientAllergyRepository.create(allergy);
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

	async getCodeArrayForNode(node, predicate, system, patientDataGraph) {
		let queryEngine = new QueryEngine();
		let bindings = await queryEngine.queryBindings(
			SPARQLQueries.getCodeForNode(node, predicate, system),
			{
				sources: [this.convertGraphToN3Store(patientDataGraph)],
			}
		);

		return new Promise((resolve, reject) => {
			let codes = [];

			bindings.on("data", async (binding) => {
				codes.push(binding.get("code").value);
			});

			bindings.on("end", () => {
				resolve(codes);
			});

			bindings.on("error", (error) => {
				reject(error);
			});
		});
	}

	isUri(value) {
		try {
			new URL(value);
			return true;
		} catch (e) {
			return false;
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

			const overallStartTime = Date.now();

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const baseFileName = `${
				pathConfig.filePrefix || "test"
			}-${testNumber}-of-${totalTests}-${timestamp}`;
			const basePath = pathConfig.baseFolder || "load-tests";
			const subPath = pathConfig.subfolder || "dental-clinic";
			const baseUrl = `${session.info.webId.replace(
				"/profile/card#me",
				""
			)}/${basePath}/${subPath}`;

			const dataFileUrl = `${baseUrl}/${baseFileName}.ttl`;

			const dataStartTime = Date.now();
			const ntriplesContent = testData.triples.join("\n");
			const dataBlob = new Blob([ntriplesContent], {
				type: "application/n-triples",
			});

			await overwriteFile(dataFileUrl, dataBlob, {
				contentType: "application/n-triples",
				fetch: session.fetch,
			});
			const dataUploadTime = Date.now() - dataStartTime;

			const totalUploadTime = Date.now() - overallStartTime;

			return {
				success: true,
				files: {
					data: {
						url: dataFileUrl,
						uploadTime: dataUploadTime,
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
}

export default new SolidService();
