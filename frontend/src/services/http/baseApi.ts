import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "./axiosBaseQuery";

/**
 * Single RTK Query API; each feature injects its own endpoints. Tags drive
 * cache invalidation (e.g. booking refreshes sessions and reservations).
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Me", "Session", "Language", "Reservation"],
  endpoints: () => ({}),
});
