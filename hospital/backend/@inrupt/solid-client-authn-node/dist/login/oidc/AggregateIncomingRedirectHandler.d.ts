/// <reference types="node" />
/**
 * @hidden
 * @packageDocumentation
 */
/**
 * Responsible for selecting the correct OidcHandler to handle the provided OIDC Options
 */
import type { IIncomingRedirectHandler, ISessionInfo, SessionConfig } from "@inrupt/solid-client-authn-core";
import { AggregateHandler } from "@inrupt/solid-client-authn-core";
import type { EventEmitter } from "events";
/**
 * @hidden
 */
export default class AggregateIncomingRedirectHandler extends AggregateHandler<[
    string,
    EventEmitter,
    SessionConfig
], ISessionInfo & {
    fetch: typeof fetch;
}> implements IIncomingRedirectHandler {
    constructor(redirectHandlers: IIncomingRedirectHandler[]);
}
