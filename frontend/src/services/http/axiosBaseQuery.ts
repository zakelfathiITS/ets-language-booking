import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, Method } from "axios";

import { type ApiError, toApiError } from "./apiError";
import { axiosClient } from "./axiosClient";
import { sessionExpired, TOKEN_ERROR_CODES } from "./sessionEvents";

export interface ApiRequest {
  url: string;
  method?: Method;
  data?: unknown;
  params?: AxiosRequestConfig["params"];
}

/** The part of the state this layer reads, kept minimal on purpose. */
interface StateWithSession {
  auth: { status: string };
}

/**
 * RTK Query base query backed by Axios: sends the page language, normalises
 * errors, and signals an expired session when the API rejects the token of a
 * signed-in user. The token travels by itself, in its httpOnly cookie.
 */
export function axiosBaseQuery(): BaseQueryFn<ApiRequest, unknown, ApiError> {
  return async ({ url, method = "GET", data, params }, api) => {
    // The API localises its validation messages: send the language of the page.
    const language = globalThis.document?.documentElement.lang || "en";

    try {
      const response = await axiosClient.request({
        url,
        method,
        data,
        params,
        signal: api.signal,
        headers: { "Accept-Language": language },
      });

      return { data: response.data };
    } catch (error) {
      const apiError = toApiError(error);

      const { status } = (api.getState() as StateWithSession).auth;
      if (status === "authenticated" && apiError.status === 401 && TOKEN_ERROR_CODES.has(apiError.code)) {
        api.dispatch(sessionExpired());
      }

      return { error: apiError };
    }
  };
}
