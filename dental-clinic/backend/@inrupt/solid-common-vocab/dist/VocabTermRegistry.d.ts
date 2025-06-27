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
/**
 * Simple registry of terms (and their associated meta-data (like labels,
 * comment, message)) in multiple languages.
 *
 * We use localStorage to store all term meta-data, which can only store
 * strings (so we need to expand out the meta-data for each term).
 */
declare class VocabTermRegistry {
    private store;
    constructor(store: Store);
    lookupLabel(termIri: string, language: string): string | undefined;
    updateLabel(termIri: string, language: string, label: string): void;
    lookupComment(termIri: string, language: string): string | undefined;
    updateComment(termIri: string, language: string, label: string): void;
    lookupMessage(termIri: string, language: string): string | undefined;
    updateMessage(termIri: string, language: string, label: string): void;
    private updateItem;
    private lookupItem;
    /**
     * Looks up the specified vocabulary term in the specified language. If no
     * value found, will lookup again using the fallback language (as set in our
     * context). If not found again, will fallback to looking up the term in
     * English.
     *
     * @param term
     * @param language
     * @returns {string}
     */
    lookupFullTerm(term: string, language: string): string | undefined;
    /**
     * Looks up the specified vocabulary term in the specified language. If no
     * value found, will lookup again using the provided fallback values one by
     * one until a value is found or there are no additional fallbacks.
     *
     * @param term {string}
     * @param language {string}
     * @param fallback {string[]}
     *
     * @returns {string | undefined}
     */
    lookupFullTermFallback(term: string, language: string, fallback: string[]): string | undefined;
}
export { VocabTermRegistry };
