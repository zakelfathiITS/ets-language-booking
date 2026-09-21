/** Public URL of the Symfony API, as reached from the browser. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Shows one-click demo accounts on the login page (handy for reviewers);
 * set NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false to hide them.
 */
export const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";

/**
 * Timezone of session dates and times, used as a display hint when no session
 * says it yet (the API's APP_TIMEZONE is the authority).
 */
export const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Europe/Paris";
