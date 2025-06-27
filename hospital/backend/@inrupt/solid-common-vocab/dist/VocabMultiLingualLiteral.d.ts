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
import type { DataFactory, Literal, NamedNode, Term } from "@rdfjs/types/data-model";
declare const NO_LANGUAGE_TAG = "<No Language>";
declare const XSD_STRING = "http://www.w3.org/2001/XMLSchema#string";
declare const RDF_LANGSTRING = "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString";
/**
 * Class that defines the concept of a multi-lingual literal (as in an RDF
 * String literal). We can add multiple values in different languages, and
 * look them up again.
 * Also supports parameterized string values (using {{0}} placeholders), for
 * which we can provide values when looking them up.
 */
declare class VocabMultiLingualLiteral implements Literal {
    _rdfFactory: DataFactory;
    _iri: NamedNode;
    _values: Map<string, string>;
    _contextMessage: string;
    _language?: string;
    _expandedMessage?: string;
    get setToEnglish(): VocabMultiLingualLiteral;
    /**
     *
     * @param rdfFactory Expected to provide RDF primitives (e.g. named nodes,
     * literals, etc.).
     * @param iri The IRI for this instance
     * @param values The values (if any) to initialise this instance
     * @param contextMessage Context information (helpful for debugging)
     * @returns {VocabMultiLingualLiteral|*}
     */
    constructor(rdfFactory: DataFactory, iri: NamedNode, values?: Map<String, String>, contextMessage?: string);
    termType: "Literal";
    get value(): string;
    get language(): string;
    equals(other: Term): boolean;
    get datatype(): NamedNode;
    getIri(): NamedNode<string>;
    asLanguage(tag: string): this;
    addValue(value: string, locale: string): this;
    lookupEnglish(mandatory: boolean): Literal | undefined;
    /**
     * Looks up a message in the currently set language, but if none found we
     * use the English message (which code-generators can enforce, so they should
     * always ensure at least an English message for vocab terms).
     *
     * NOTE: If we do use the English default, then we also reset our language
     * tag so that if we are returning an RDF literal it will contain the correct
     * language tag (i.e. 'en'), and not the requested language that didn't exist!
     *
     * @param mandatory Flag - if true, we'll Throw an error if no value found.
     * @returns {*}
     */
    lookup(mandatory: boolean): Literal | undefined;
    /**
     * Private method that only looks up the string itself (i.e. will not attempt
     * to wrap in an RDF literal).
     *
     * @param mandatory Flag - if true, we'll Throw an error if no value found.
     * @returns {*}
     */
    lookupButDefaultToEnglishOrNoLanguage(mandatory: boolean): string | undefined;
    /**
     * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single
     *  string, which I guess it should...!?
     *
     * @param mandatory Flag - if true, we'll Throw an error if no value found.
     * @param rest array of values to be used to replace placeholders in
     * the looked-up message.
     * @returns {*}
     */
    params(mandatory: boolean, ...rest: string[]): Literal | undefined;
    /**
     * We use a marker for no-language literals, so this handles that marker
     * and returns the correct RDF tag for 'no-language'.
     *
     * @returns {string}
     */
    handleNoLanguageTag(): string | undefined;
}
export { VocabMultiLingualLiteral, NO_LANGUAGE_TAG, XSD_STRING, RDF_LANGSTRING, };
