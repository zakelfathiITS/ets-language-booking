import axios from "axios";

/**
 * The only HTTP client of the application. URLs are relative: the API is
 * reached through this origin (see src/app/api), which keeps its cookie first-party.
 */
export const axiosClient = axios.create({
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
