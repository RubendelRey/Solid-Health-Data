import type { IClient, IIssuerConfig, KeyPair, TokenEndpointResponse } from "@inrupt/solid-client-authn-core";
export type CodeExchangeResult = TokenEndpointResponse & {
    idToken: string;
    webId: string;
    dpopKey?: KeyPair;
};
export type TokenEndpointInput = {
    grantType: string;
    redirectUrl: string;
    code: string;
    codeVerifier: string;
};
export declare function validateTokenEndpointResponse(tokenResponse: Record<string, unknown>, dpop: boolean): Record<string, unknown> & {
    access_token: string;
    id_token: string;
    expires_in?: number;
};
export declare function getTokens(issuer: IIssuerConfig, client: IClient, data: TokenEndpointInput, dpop: true): Promise<CodeExchangeResult>;
export declare function getTokens(issuer: IIssuerConfig, client: IClient, data: TokenEndpointInput, dpop: false): Promise<CodeExchangeResult>;
/**
 * This function exchanges an authorization code for a bearer token.
 * Note that it is based on oidc-client-js, and assumes that the same client has
 * been used to issue the initial redirect.
 * @param redirectUrl The URL to which the user has been redirected
 */
export declare function getBearerToken(redirectUrl: string): Promise<CodeExchangeResult>;
export declare function getDpopToken(issuer: IIssuerConfig, client: IClient, data: TokenEndpointInput): Promise<CodeExchangeResult>;
