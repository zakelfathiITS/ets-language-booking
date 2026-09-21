import axios from "axios";

import { API_URL } from "@/lib/env";

/** The only HTTP client of the application. */
export const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
