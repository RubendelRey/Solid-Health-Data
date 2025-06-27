'use strict';

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
// Importantly, this storage instance needs to be a global, so that its
// contents are intentionally shared (as it's meant to replicate the notion of
// 'Local Storage' in a browser).
const storage = new Map();
/**
 * Returns a local store instance.
 */
function buildStore() {
    return {
        setItem: (key, value) => {
            storage.set(key, value);
        },
        getItem: (key) => {
            const result = storage.get(key);
            return result ? result : null;
        },
        removeItem: (key) => {
            storage.delete(key);
        },
        get length() {
            return storage.size;
        },
        clear: () => storage.clear(),
        key: function (index) {
            const iterator = storage.entries();
            let item = iterator.next();
            for (let i = 0; i < index; i++) {
                item = iterator.next();
            }
            return item && item.value ? item.value[0] : null;
        },
    };
}
/**
 * Returns localStore in a browser environment, and a local store instance otherwise
 */
function getLocalStore() {
    if (typeof window !== "undefined" &&
        typeof window.localStorage !== "undefined") {
        return window.localStorage;
    }
    return buildStore();
}

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
// Key for the locale to use if one is not explicitly provided as an override.
const CONTEXT_KEY_LOCALE = "i18nextLng";
// Key that specifies a preferred fallback language - e.g. if the user selects
// 'French' as the language for the current page, but there is no French, then
// we'll check if the user has a preferred fallback language, e.g. maybe in
// their profile they have selected 'Spanish' as their preferred fallback.
const CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE = "lang_preferred_fallback";
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
class VocabContext {
    constructor(locale, storage) {
        if (!locale) {
            throw new Error("A new context *MUST* be provided a locale, but none was provided.");
        }
        if (!storage) {
            throw new Error(`A new context *MUST* be provided storage (we expect 'localStorage').`);
        }
        this._initialLocale = locale;
        this._storage = storage;
        this._storage.setItem(CONTEXT_KEY_LOCALE, locale);
        this._createdAt = Date.now();
    }
    getLocale() {
        var _a;
        return (_a = this._storage.getItem(CONTEXT_KEY_LOCALE)) !== null && _a !== void 0 ? _a : this._initialLocale;
    }
    setLocale(locale) {
        this._storage.setItem(CONTEXT_KEY_LOCALE, locale);
        return this;
    }
    getInitialLocale() {
        return this._initialLocale;
    }
    getCreatedAt() {
        return this._createdAt;
    }
}

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
class VocabContextError extends Error {
    constructor(context, message, wrappedException) {
        // The ignore is required because of code coverage bug
        // https://github.com/gotwarlost/istanbul/issues/690
        super(message) /* istanbul ignore next */;
        if (wrappedException) {
            if (wrappedException instanceof VocabContextError) {
                this._wrappedException = wrappedException;
                this.message = `${this.message}\nContains context error: ${wrappedException.message}`;
            }
            else if (wrappedException instanceof Error) {
                this._wrappedException = wrappedException;
                this.message = `${this.message}\nContains error: ${wrappedException.message}`;
            }
            else {
                throw new Error(`Context error can only wrap ContextErrors or Errors, but got [${wrappedException}] (message was [${message}]).`);
            }
        }
        this._context = context;
        this._createdAt = Date.now();
        // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, VocabContextError.prototype);
    }
    report(level, totalLevels, exception) {
        var _a;
        let result = exception.message;
        const stack = exception.stack ? exception.stack.toString() : "";
        // Ignoring the next line is required for full code coverage, because when
        // testing in a Node environment, it is not possible to have `process`
        // undefined.
        // istanbul ignore next
        if (((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) !== "production") {
            result += "\n" + `Level ${level} of ${totalLevels}:\n${stack}`;
        }
        return result;
    }
    countLevels() {
        let result = 1;
        let current = this;
        while (current && current._wrappedException) {
            if (!(current._wrappedException instanceof VocabContextError)) {
                // If we have wrapped a standard exception, then the unwrapping stops,
                //  because standard errors can't wrap other errors.
                current = undefined;
                result++;
            }
            else {
                current = current._wrappedException;
                result++;
            }
        }
        return result;
    }
    unwrapException() {
        const totalLevels = this.countLevels();
        let level = 1;
        let result = "";
        let current = this;
        while (current !== undefined) {
            result += "\n\n" + this.report(level++, totalLevels, current);
            if (!(current._wrappedException instanceof VocabContextError) &&
                current._wrappedException) {
                result +=
                    "\n\n" + this.report(level++, totalLevels, current._wrappedException);
                // When reaching a plain Error, the unwrapping stops
                current = undefined;
            }
            else {
                // Unwraps the exception until _wrappedException is undefined
                current = current._wrappedException;
            }
        }
        return result;
    }
    toString() {
        return this.unwrapException();
    }
    contains(elements) {
        if (!elements) {
            return true;
        }
        const message = this.unwrapException();
        return elements
            .map((element) => message.includes(element))
            .reduce((acc, current) => acc && current, true);
    }
}

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
const NO_LANGUAGE_TAG = "<No Language>";
// Typically, these term IRIs would come from a generated artifact, but since
// those generated artifacts may depend on this current project (i.e., if we
// wanted the metadata (e.g., like the `rdfs:label` or `rdfs:comment` values))
// associated with these terms, it's just much easier to define the IRI
// constants we need manually here.
const XSD_STRING = "http://www.w3.org/2001/XMLSchema#string";
const RDF_LANGSTRING = "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString";
function isLiteral(term) {
    return term.language !== undefined;
}
/**
 * Class that defines the concept of a multi-lingual literal (as in an RDF
 * String literal). We can add multiple values in different languages, and
 * look them up again.
 * Also supports parameterized string values (using {{0}} placeholders), for
 * which we can provide values when looking them up.
 */
class VocabMultiLingualLiteral {
    get setToEnglish() {
        this.asLanguage("en");
        return this;
    }
    /**
     *
     * @param rdfFactory Expected to provide RDF primitives (e.g. named nodes,
     * literals, etc.).
     * @param iri The IRI for this instance
     * @param values The values (if any) to initialise this instance
     * @param contextMessage Context information (helpful for debugging)
     * @returns {VocabMultiLingualLiteral|*}
     */
    constructor(rdfFactory, iri, values, contextMessage) {
        // Implementing the RDF/JS Literal interface
        this.termType = "Literal";
        this._rdfFactory = rdfFactory;
        this._iri = iri;
        this._values = values ? values : new Map();
        this._contextMessage = contextMessage ? contextMessage : "<None provided>";
        this._language = undefined;
        this._expandedMessage = undefined;
    }
    get value() {
        var _a, _b;
        return (_b = (_a = this.lookup(false)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "";
    }
    get language() {
        if (!this._language || this._language === NO_LANGUAGE_TAG) {
            return "";
        }
        else {
            return this._language;
        }
    }
    equals(other) {
        if (isLiteral(other)) {
            return (this._values.get(other.language || NO_LANGUAGE_TAG) === other.value);
        }
        else {
            return false;
        }
    }
    get datatype() {
        if (!this.language || this.language == NO_LANGUAGE_TAG) {
            return this._rdfFactory.namedNode(XSD_STRING);
        }
        else {
            return this._rdfFactory.namedNode(RDF_LANGSTRING);
        }
    }
    getIri() {
        return this._iri;
    }
    asLanguage(tag) {
        this._language = tag;
        return this;
    }
    addValue(value, locale) {
        if (!this._language) {
            this._language = locale;
        }
        this._values.set(locale, value);
        return this;
    }
    lookupEnglish(mandatory) {
        return this.asLanguage("en").lookup(mandatory);
    }
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
    lookup(mandatory) {
        const message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);
        if (message === undefined) {
            return undefined;
        }
        this._expandedMessage = message;
        return this._rdfFactory.literal(message, this.handleNoLanguageTag());
    }
    /**
     * Private method that only looks up the string itself (i.e. will not attempt
     * to wrap in an RDF literal).
     *
     * @param mandatory Flag - if true, we'll Throw an error if no value found.
     * @returns {*}
     */
    lookupButDefaultToEnglishOrNoLanguage(mandatory) {
        if (!this._language) {
            if (mandatory) {
                throw new Error("No value has been added to the literal");
            }
            else {
                return undefined;
            }
        }
        let message = this._values.get(this._language);
        if (message) {
            return message;
        }
        else if (mandatory) {
            // NOTE: we explicitly throw here, regardless of our 'throw' parameter.
            throw new Error(`MultiLingualLiteral message with IRI [${this._iri.value}] required value in language [${this._language}], but none found (Context: [${this._contextMessage}]).`);
        }
        else {
            message = this._values.get("en");
            if (message) {
                this._language = "en";
            }
            else {
                message = this._values.get(NO_LANGUAGE_TAG);
                this._language = NO_LANGUAGE_TAG;
            }
        }
        return message;
    }
    /**
     * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single
     *  string, which I guess it should...!?
     *
     * @param mandatory Flag - if true, we'll Throw an error if no value found.
     * @param rest array of values to be used to replace placeholders in
     * the looked-up message.
     * @returns {*}
     */
    params(mandatory, ...rest) {
        let message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);
        // If we failed to find a value at all (and didn't throw!), then return
        // 'undefined'.
        if (message === undefined) {
            return undefined;
        }
        const paramsRequired = message.split("{{").length - 1;
        if (paramsRequired !== rest.length) {
            throw new Error(`Setting parameters on LitMultiLingualLiteral with IRI [${this._iri.value}] and value [${message}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${rest.length}] (Context: [${this._contextMessage}]).`);
        }
        for (let i = 0; i < rest.length; i++) {
            const marker = `{{${i}}}`;
            message = message.replace(marker, rest[i]);
        }
        this._expandedMessage = message;
        return this._rdfFactory.literal(message, this.handleNoLanguageTag());
    }
    /**
     * We use a marker for no-language literals, so this handles that marker
     * and returns the correct RDF tag for 'no-language'.
     *
     * @returns {string}
     */
    handleNoLanguageTag() {
        return this._language === NO_LANGUAGE_TAG ? "" : this._language;
    }
}

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
/**
 * Simple registry of terms (and their associated meta-data (like labels,
 * comment, message)) in multiple languages.
 *
 * We use localStorage to store all term meta-data, which can only store
 * strings (so we need to expand out the meta-data for each term).
 */
class VocabTermRegistry {
    constructor(store) {
        this.store = store;
    }
    lookupLabel(termIri, language) {
        return this.lookupItem(termIri, language, "label");
    }
    updateLabel(termIri, language, label) {
        this.updateItem(termIri, language, label, "label");
    }
    lookupComment(termIri, language) {
        return this.lookupItem(termIri, language, "comment");
    }
    updateComment(termIri, language, label) {
        this.updateItem(termIri, language, label, "comment");
    }
    lookupMessage(termIri, language) {
        return this.lookupItem(termIri, language, "message");
    }
    updateMessage(termIri, language, label) {
        this.updateItem(termIri, language, label, "message");
    }
    updateItem(termIri, language, label, item) {
        this.store.setItem(`${termIri}-${item}-${language}`, label);
    }
    lookupItem(termIri, language, item) {
        return this.lookupFullTerm(`${termIri}-${item}-`, language);
    }
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
    lookupFullTerm(term, language) {
        var _a;
        const fallbackLanguage = (_a = this.store.getItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE)) !== null && _a !== void 0 ? _a : "en";
        return this.lookupFullTermFallback(term, language, [
            fallbackLanguage,
            "en",
            NO_LANGUAGE_TAG,
        ]);
    }
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
    lookupFullTermFallback(term, language, fallback) {
        const result = this.store.getItem(`${term}${language}`);
        if (result) {
            return result;
        }
        else if (fallback.length > 0) {
            return this.lookupFullTermFallback(term, fallback[0], fallback.slice(1));
        }
        else {
            return undefined;
        }
    }
}

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
const DEFAULT_LOCALE = "en";
// Array of RDF types that we consider 'Classes'.
const RDF_TYPE_CLASS = [
    "http://www.w3.org/2000/01/rdf-schema#Class",
    "http://www.w3.org/2002/07/owl#Class",
];
// Array of RDF types that we consider 'Properties'.
const RDF_TYPE_PROPERTY = [
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
    "http://www.w3.org/2002/07/owl#Property",
    "http://www.w3.org/2002/07/owl#ObjectProperty",
    "http://www.w3.org/2002/07/owl#AnnotationProperty",
    "http://www.w3.org/2002/07/owl#TransitiveProperty",
    "http://www.w3.org/2002/07/owl#FunctionalProperty",
    "http://www.w3.org/2002/07/owl#InverseFunctionalProperty",
    "http://www.w3.org/2002/07/owl#SymmetricProperty",
];
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
class VocabTerm {
    get value() {
        return this.iri.value;
    }
    equals(other) {
        return this.iri.equals(other);
    }
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
    constructor(iri, rdfFactory, contextStorage, strict) {
        // Implementation of the NamedNode interface.
        this.termType = "NamedNode";
        if (typeof iri === "string") {
            this.iri = rdfFactory.namedNode(iri);
        }
        else {
            this.iri = iri;
        }
        this.rdfFactory = rdfFactory;
        if (strict !== undefined) {
            this.strict = strict;
        }
        else {
            this.strict = false;
        }
        this._vocabContext = new VocabContext(DEFAULT_LOCALE, contextStorage);
        this._registry = new VocabTermRegistry(contextStorage);
        // Create holders for meta-data on this vocabulary term (we could probably
        // lazily create these only if values are actually provided!).
        this._label = new VocabMultiLingualLiteral(rdfFactory, this.iri, undefined, "rdfs:label");
        this._comment = new VocabMultiLingualLiteral(rdfFactory, this.iri, undefined, "rdfs:comment");
        this._message = new VocabMultiLingualLiteral(rdfFactory, this.iri, undefined, "message (should be defined in RDF vocab using: skos:definition)");
        if (!strict) {
            // This can be overwritten if we get an actual no-language label later,
            // which would be perfectly fine.
            this._label.addValue(VocabTerm.extractIriLocalName(iri), NO_LANGUAGE_TAG);
        }
        // Stateful variables defaults.
        this._mandatory = true;
        this._languageOverride = undefined;
        this._isDefinedBy = undefined;
        this._seeAlso = undefined;
        this._type = undefined;
        this.resetState();
    }
    // Set our mandatory flag - i.e. throws if not as expected.
    get mandatory() {
        this._mandatory = true;
        return this;
    }
    get seeAlso() {
        return this._seeAlso;
    }
    get type() {
        return this._type;
    }
    get isDefinedBy() {
        return this._isDefinedBy;
    }
    // Simple convenience accessor for requesting English.
    get asEnglish() {
        return this.asLanguage("en");
    }
    // Explicitly named alias for getting the IRI of this term as a String.
    get iriAsString() {
        return this.value;
    }
    // Accessor for label that uses our LitSessionContext instance.
    get labelLiteral() {
        try {
            const language = this.useLanguageOverrideOrGetFromContext();
            return this._label.asLanguage(language).lookup(this._mandatory);
        }
        finally {
            this.resetState();
        }
    }
    get label() {
        const label = this.labelLiteral;
        return label && label.value;
    }
    // Accessor for comment that uses our LitSessionContext instance.
    get commentLiteral() {
        try {
            const language = this.useLanguageOverrideOrGetFromContext();
            return this._comment.asLanguage(language).lookup(this._mandatory);
        }
        finally {
            this.resetState();
        }
    }
    get comment() {
        const comment = this.commentLiteral;
        return comment && comment.value;
    }
    // Accessor for message that uses our LitSessionContext instance.
    get messageLiteral() {
        try {
            const language = this.useLanguageOverrideOrGetFromContext();
            return this._message.asLanguage(language).lookup(this._mandatory);
        }
        finally {
            this.resetState();
        }
    }
    get message() {
        const message = this.messageLiteral;
        return message && message.value;
    }
    get isRdfClass() {
        if (!this._type) {
            return false;
        }
        // Spread our types Set into an array to find the first (if any)
        // occurrence of array of matching types.
        return ([...this._type].find((rdfType) => RDF_TYPE_CLASS.includes(rdfType.value)) !== undefined);
    }
    get isRdfProperty() {
        if (!this._type) {
            return false;
        }
        // Spread our types Set into an array to find the first (if any)
        // occurrence of array of matching types.
        return ([...this._type].find((rdfType) => RDF_TYPE_PROPERTY.includes(rdfType.value)) !== undefined);
    }
    // Get the IRI of this term as a String (means we can treat this object
    // instance as a string more easily).
    // NOTE: This is *NOT* an accessor, but deliberately overriding the
    // 'toString()' method on the base Object.
    toString() {
        return this.value;
    }
    messageParamsLiteral(...rest) {
        const language = this.useLanguageOverrideOrGetFromContext();
        try {
            return this._message
                .asLanguage(language)
                .params(this._mandatory, ...rest);
        }
        finally {
            this.resetState();
        }
    }
    messageParams(...rest) {
        const messageParams = this.messageParamsLiteral(...rest);
        return messageParams && messageParams.value;
    }
    resetState() {
        this._languageOverride = undefined;
        this._mandatory = false;
    }
    addSeeAlso(value) {
        if (!this._seeAlso) {
            this._seeAlso = new Set();
        }
        this._seeAlso.add(value);
        return this;
    }
    addType(value) {
        if (!this._type) {
            this._type = new Set();
        }
        this._type.add(value);
        return this;
    }
    addIsDefinedBy(value) {
        this._isDefinedBy = value;
        return this;
    }
    addLabelNoLanguage(value) {
        return this.addLabel(value, NO_LANGUAGE_TAG);
    }
    addLabel(value, language) {
        this.validateAddParams(value, language, "label");
        this._label.addValue(value, language);
        this._registry.updateLabel(this.value, language, value);
        return this;
    }
    addCommentNoLanguage(value) {
        return this.addComment(value, NO_LANGUAGE_TAG);
    }
    addComment(value, language) {
        this.validateAddParams(value, language, "comment");
        this._comment.addValue(value, language);
        this._registry.updateComment(this.value, language, value);
        return this;
    }
    addMessageNoLanguage(value) {
        return this.addMessage(value, NO_LANGUAGE_TAG);
    }
    addMessage(value, language) {
        this.validateAddParams(value, language, "message");
        this._message.addValue(value, language);
        this._registry.updateMessage(this.value, language, value);
        return this;
    }
    /**
     * Ensure we always provide both a value and a lnaguage tag for that value.
     *
     * @param value the test of the value
     * @param language the language tag for the value
     * @param what what kind of value we are adding
     */
    validateAddParams(value, language, what) {
        if (value === undefined || value === null) {
            throw new Error(`Attempted to add a non-existent [${what}] value to vocab term`);
        }
        if (!language) {
            throw new Error(`Attempted to add the [${what}] value [${value}], but without specifying a language`);
        }
        return this;
    }
    useLanguageOverrideOrGetFromContext() {
        return this._languageOverride === undefined
            ? this._vocabContext.getLocale()
            : this._languageOverride;
    }
    asLanguage(language) {
        // An empty string is converted to the NO_LANGUAGE_TAG.
        this._languageOverride = language || NO_LANGUAGE_TAG;
        return this;
    }
    /**
     * Extract the local name from the specified IRI (can be a primitive string or
     * a NamedNode).
     *
     * @param stringOrNamedNode The IRI to extract from.
     * @returns {string}
     */
    static extractIriLocalName(stringOrNamedNode) {
        const iri = this.isString(stringOrNamedNode)
            ? stringOrNamedNode
            : stringOrNamedNode.value;
        const hashPos = iri.lastIndexOf("#");
        if (hashPos > -1) {
            return iri.substring(hashPos + 1);
        }
        const lastSlashPos = iri.lastIndexOf("/");
        if (lastSlashPos === -1 ||
            (iri.toLowerCase().startsWith("http") &&
                lastSlashPos < (iri.toLowerCase().startsWith("https") ? 8 : 7))) {
            throw Error(`Expected hash fragment ('#') or slash ('/') (other than 'https://...') in IRI [${iri}]`);
        }
        else {
            return iri.substring(lastSlashPos + 1);
        }
    }
    /**
     * Simple method to determine if the specified value is a primitive String.
  
     * @param value The value to evaluate.
     * @returns {boolean} true if String, else false.
     */
    static isString(value) {
        return typeof value === "string" || value instanceof String;
    }
    /**
     * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
     * (case-insensitive).
     *
     * @param value
     * @returns {boolean}
     */
    static isStringIri(value) {
        if (!this.isString(value)) {
            return false;
        }
        const valueLower = value.toLowerCase();
        return (valueLower.startsWith("http://") || valueLower.startsWith("https://"));
    }
}

exports.CONTEXT_KEY_LOCALE = CONTEXT_KEY_LOCALE;
exports.CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE = CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE;
exports.NO_LANGUAGE_TAG = NO_LANGUAGE_TAG;
exports.VocabContext = VocabContext;
exports.VocabContextError = VocabContextError;
exports.VocabMultiLingualLiteral = VocabMultiLingualLiteral;
exports.VocabTerm = VocabTerm;
exports.VocabTermRegistry = VocabTermRegistry;
exports.buildStore = buildStore;
exports.getLocalStore = getLocalStore;
