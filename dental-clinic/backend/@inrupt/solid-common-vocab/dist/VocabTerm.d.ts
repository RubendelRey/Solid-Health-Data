/**
 * Begin license text.
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * End license text.Source Distributions
 */
import { Store } from "./util/localStorage";
import type { DataFactory, NamedNode, Term, Literal } from "@rdfjs/types/data-model";
import { IriString } from "./index";
/**
 * Class to represent vocabulary terms. We expect derived classes to extend
 * an IRI (e.g. a NamedNode in RDF/JS), but we just provide effectively an
 * abstract base class providing meta-data associated with terms in a
 * vocabulary, like labels and comments (in multiple-languages).
 *
 * We can also take a reference to a context storage instance, which can
 * contain various contextual information, such as the current locale, or
 * language settings for an interaction that can be used to lookup context at
 * runtime (e.g. to look up the locale for a term's label at runtime if one is
 * not explicitly asked for).
 *
 * This Turtle snippet may help illustrate what this class supports:
 *
 *   prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *   prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 *   prefix skos:     <http://www.w3.org/2004/02/skos/core#>
 *   prefix ex:   <http://example.com/>
 *
 *   ex:name a rdf:Property ;
 *     rdfs:label "Name" ;
 *     rdfs:label "First name"@en ;
 *     rdfs:label "Nombre"@es ;
 *     rdfs:comment "A person's first name"@en .
 *
 *   ex:errNameTooLong a rdfs:Literal ;
 *     skos:definition "Name must be less than {{0}}, but we got {{1}}"@en .
 *
 * NOTE: Since this class does NOT actually store the IRI value for the vocab
 * term (since we expect derived classes to provide that), testing this
 * class in isolation will result in strange looking (i.e. 'undefined-'
 * prefixed) key values in 'localStorage' since we create those keys based on
 * the term IRI (that we don't store!). Currently, this doesn't cause any
 * problems, but it's just something to be aware of!
 */
declare class VocabTerm implements NamedNode {
    iri: NamedNode;
    rdfFactory: DataFactory;
    strict: boolean;
    private _label;
    private _comment;
    private _message;
    private _vocabContext;
    private _registry;
    private _mandatory;
    private _languageOverride;
    private _isDefinedBy;
    private _seeAlso;
    private _type;
    termType: "NamedNode";
    get value(): string;
    equals(other: Term): boolean;
    /**
     * Constructor.
     *
     * @param iri the IRI for this vocabulary term
     * @param rdfFactory an underlying RDF library that can create IRI's
     * @param contextStorage context for this term
     * @param strict flag if we should be strict. If not strict, we can use the
     * path component of the term's IRI as the English label if no explicit
     * English label (or no-language label) is provided, e.g. 'name' for the
     * term 'http://example.com/vocab#name'.
     */
    constructor(iri: NamedNode | IriString, rdfFactory: DataFactory, contextStorage: Store, strict?: boolean);
    get mandatory(): VocabTerm;
    get seeAlso(): Set<NamedNode> | undefined;
    get type(): Set<NamedNode> | undefined;
    get isDefinedBy(): NamedNode | undefined;
    get asEnglish(): VocabTerm;
    get iriAsString(): string;
    get labelLiteral(): Literal | undefined;
    get label(): string | undefined;
    get commentLiteral(): Literal | undefined;
    get comment(): string | undefined;
    get messageLiteral(): Literal | undefined;
    get message(): string | undefined;
    get isRdfClass(): boolean;
    get isRdfProperty(): boolean;
    toString(): string;
    messageParamsLiteral(...rest: string[]): Literal | undefined;
    messageParams(...rest: string[]): string | undefined;
    resetState(): void;
    addSeeAlso(value: NamedNode): this;
    addType(value: NamedNode): this;
    addIsDefinedBy(value: NamedNode): this;
    addLabelNoLanguage(value: string): this;
    addLabel(value: string, language: string): this;
    addCommentNoLanguage(value: string): this;
    addComment(value: string, language: string): this;
    addMessageNoLanguage(value: string): this;
    addMessage(value: string, language: string): this;
    /**
     * Ensure we always provide both a value and a lnaguage tag for that value.
     *
     * @param value the test of the value
     * @param language the language tag for the value
     * @param what what kind of value we are adding
     */
    validateAddParams(value: string, language: string, what: string): this;
    useLanguageOverrideOrGetFromContext(): string;
    asLanguage(language: string): this;
    /**
     * Extract the local name from the specified IRI (can be a primitive string or
     * a NamedNode).
     *
     * @param stringOrNamedNode The IRI to extract from.
     * @returns {string}
     */
    static extractIriLocalName(stringOrNamedNode: string | NamedNode): string;
    /**
     * Simple method to determine if the specified value is a primitive String.
  
     * @param value The value to evaluate.
     * @returns {boolean} true if String, else false.
     */
    static isString(value: string | NamedNode): value is string;
    /**
     * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
     * (case-insensitive).
     *
     * @param value
     * @returns {boolean}
     */
    static isStringIri(value: string): boolean;
}
export { VocabTerm };
