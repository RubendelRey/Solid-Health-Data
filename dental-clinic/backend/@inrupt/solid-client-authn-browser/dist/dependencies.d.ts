/**
 * @hidden
 * @packageDocumentation
 */
/**
 * Top Level core document. Responsible for setting up the dependency graph
 */
import type { IStorage } from "@inrupt/solid-client-authn-core";
import ClientAuthentication from "./ClientAuthentication";
/**
 *
 * @param dependencies
 * @deprecated This function will be removed from the external API in an upcoming release.
 */
export declare function getClientAuthenticationWithDependencies(dependencies: {
    secureStorage?: IStorage;
    insecureStorage?: IStorage;
}): ClientAuthentication;
