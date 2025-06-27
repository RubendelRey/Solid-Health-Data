export default class SPARQLQueries {
	static getInterventions() {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?i ?status ?date WHERE {
            ?i fhir:status ?status .
            ?i fhir:occurrenceDateTime ?date
        }
        `;
	}

	static getAllergies() {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?a ?recordedDate ?criticality WHERE {
            ?a fhir:criticality ?criticality .
            ?a fhir:recordedDate ?recordedDate .
        }
        `;
	}

	static getCodeForNode(node, predicate, system) {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?code ?text WHERE {
            <${node}> fhir:${predicate} ?codeable .
            ?codeable fhir:coding ?coding .
         
            ?coding fhir:system <${system}> ;
                    fhir:code ?code ;
        }
        `;
	}
}
