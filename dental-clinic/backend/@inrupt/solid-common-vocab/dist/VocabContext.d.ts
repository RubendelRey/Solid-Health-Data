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
declare const CONTEXT_KEY_LOCALE: string;
declare const CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE: string;
/**
 * Simple class to hold 'context', which could include things like a chosen
 * language, localization settings, process details (like the credentials of
 * the process, time the process started, the process ID, etc.).
 *
 * We can be configured with a storage instance on construction (e.g. to
 * attempt to read values from 'localStorage' in cases when we are deployed
 * within a browser - e.g., a language drop-down might set the current
 * language using a simple key value of say 'i18nLanguage' in localStorage).
 */
declare class VocabContext {
    _initialLocale: string;
    _storage: Store;
    _createdAt: number;
    constructor(locale: string, storage: Store);
    getLocale(): string;
    setLocale(locale: string): VocabContext;
    getInitialLocale(): string;
    getCreatedAt(): number;
}
export { VocabContext, CONTEXT_KEY_LOCALE, CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, };
