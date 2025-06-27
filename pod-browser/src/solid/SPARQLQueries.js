export default class SPARQLQueries {
	static getProcedures() {
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

	static getPatient() {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?patient ?gender ?birthDate ?fullName ?familyName
        WHERE {
            ?patient fhir:gender ?gender ;
                    fhir:birthDate ?birthDate ;
                    fhir:name ?nameNode .
            
            ?nameNode fhir:text ?fullName ;
                        fhir:family ?familyName .
                
            FILTER NOT EXISTS {
                ?i fhir:actor ?patient .
            }
        }
        `;
	}

	static getTelecomFor(node) {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?system ?value ?use WHERE {
            <${node}> fhir:telecom ?telecomNode .
            ?telecomNode fhir:system ?system ;
                        fhir:value ?value .
            OPTIONAL {
                ?telecomNode fhir:use ?use .
            }
        }
        `;
	}

	static getCodeableConceptFor(node, predicate) {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?codeable ?text WHERE {
            <${node}> fhir:${predicate} ?codeable .
          ?codeable fhir:coding ?coding ;
          			fhir:text ?text .
        }
        `;
	}

	static getCodingFor(node) {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>
        SELECT ?code ?system ?display WHERE {
            <${node}> fhir:coding ?coding .
            ?coding fhir:code ?code ;
                    fhir:system ?system ;
                    fhir:display ?display
        }
        `;
	}

	static findCodeableConcept(code, system) {
		return `
        PREFIX fhir: <http://hl7.org/fhir/>

        SELECT ?codeable ?code WHERE {
            ?codeable fhir:coding ?coding .

            ?coding fhir:code ?code ;
                    fhir:system <${system}> .
        }
        `;
	}
}
