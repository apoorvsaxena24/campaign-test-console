/**
 * iamix SSO Integration -- STUBBED for v2
 *
 * When enabled, this module will handle Auth0/iamix SSO authentication:
 * - Redirect to Auth0 login URL via iamix `/auth/sso`
 * - Handle Auth0 callback with authorization code
 * - Exchange code for JWT access token
 * - Validate session with Engage backend
 * - Manage token lifecycle (refresh, revoke)
 *
 * iamix endpoints (future):
 * - POST /v2/auth0/users/:email/verification-requests
 * - GET  /v2/auth0/users/:email/profile
 * - DELETE /v2/auth0/users/:email/sessions
 * - GET  /v2/sso_tenants/:accountSid
 * - GET  /logout
 *
 * Required config (future):
 * - Auth0 issuer URL
 * - Auth0 audience
 * - Auth0 client ID
 * - iamix base URL
 */

export interface IamixSSOConfig {
  iamixBaseUrl: string;
  auth0Issuer: string;
  auth0Audience: string;
  auth0ClientId: string;
}

export interface IamixUserProfile {
  email: string;
  name: string;
  userId: string;
  emailVerified: boolean;
  blocked: boolean;
}

export function initiateSSOLogin(_config: IamixSSOConfig): never {
  throw new Error(
    "SSO login is not enabled in this version. Configure iamix SSO in v2.",
  );
}

export function handleSSOCallback(
  _code: string,
  _config: IamixSSOConfig,
): Promise<never> {
  throw new Error("SSO callback handling is not enabled in this version.");
}

export function validateSSOSession(_token: string): Promise<never> {
  throw new Error("SSO session validation is not enabled in this version.");
}

export function revokeSSOSession(
  _email: string,
  _config: IamixSSOConfig,
): Promise<never> {
  throw new Error("SSO session revocation is not enabled in this version.");
}

export const SSO_ENABLED = false;
