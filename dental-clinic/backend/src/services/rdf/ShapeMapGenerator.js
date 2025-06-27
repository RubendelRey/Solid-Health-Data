class ShapeMapGenerator {
	constructor() {
		this.shapeMappings = new Map();
	}

	generateShapeMap(rdfGraph) {
		this.shapeMappings.clear();

		this.analyzeGraph(rdfGraph);

		return this.generateShapeMapContent();
	}

	analyzeGraph(rdfGraph) {
		const statements = rdfGraph.statements;
		const nodeProperties = new Map();

		statements.forEach((statement) => {
			const subject = statement.subject.value;
			const predicate = statement.predicate.value;
			const object = statement.object.value;

			if (!nodeProperties.has(subject)) {
				nodeProperties.set(subject, new Set());
			}
			nodeProperties.get(subject).add(predicate);
		});

		nodeProperties.forEach((properties, nodeUri) => {
			const shape = this.determineShape(properties);
			if (shape) {
				if (!this.shapeMappings.has(shape)) {
					this.shapeMappings.set(shape, []);
				}
				this.shapeMappings.get(shape).push(nodeUri);
			}
		});
	}

	determineShape(properties) {
		const props = Array.from(properties);

		if (this.hasProperties(props, ["name", "birthDate", "gender"])) {
			return "ex:PatientShape";
		}

		if (this.hasProperties(props, ["code", "occurrenceDateTime", "status"])) {
			return "ex:ProcedureShape";
		}

		if (
			this.hasProperties(props, ["identifier", "name"]) &&
			!this.hasProperties(props, ["birthDate"])
		) {
			return "ex:PractitionerShape";
		}

		if (this.hasProperties(props, ["actor"])) {
			return "ex:PerformerShape";
		}

		if (this.hasProperties(props, ["system", "value"])) {
			return "ex:ContactPointShape";
		}

		if (this.hasProperties(props, ["code", "clinicalStatus", "recordedDate"])) {
			return "ex:AllergyIntolerance";
		}

		if (this.hasProperties(props, ["coding", "text"])) {
			return "ex:CodeableConceptShape";
		}

		if (this.hasProperties(props, ["system", "code", "display"])) {
			return "ex:CodingShape";
		}

		return null;
	}

	hasProperties(nodeProperties, requiredProperties) {
		return requiredProperties.every((prop) =>
			nodeProperties.some(
				(nodeProp) =>
					nodeProp.includes(`fhir/${prop}`) || nodeProp.endsWith(`/${prop}`)
			)
		);
	}

	generateShapeMapContent() {
		let content = "";

		const sortedShapes = Array.from(this.shapeMappings.keys()).sort();

		sortedShapes.forEach((shape) => {
			const nodes = this.shapeMappings.get(shape);
			nodes.forEach((node, index) => {
				content += `<${node}>@${shape}${","}\n`;
			});
		});

		if (content.endsWith(",\n")) {
			content = content.slice(0, -2);
		}

		return content;
	}
}

export default new ShapeMapGenerator();
