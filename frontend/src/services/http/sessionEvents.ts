import { createAction } from "@reduxjs/toolkit";

/**
 * Dispatched when the API rejects the access token (missing, invalid or
 * expired). Declared here so the HTTP layer does not depend on the auth
 * feature; the auth slice reacts to it.
 */
export const sessionExpired = createAction("auth/sessionExpired");

export const TOKEN_ERROR_CODES = new Set(["token_missing", "token_invalid", "token_expired"]);
