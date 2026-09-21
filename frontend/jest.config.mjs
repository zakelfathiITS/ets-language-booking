import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/**
 * Run through `npm test`, which enables Node's VM modules: MSW depends on
 * ESM-only packages that Jest can only load that way.
 *
 * @type {import("jest").Config}
 */
const config = {
  // jsdom with the fetch/stream globals MSW needs.
  testEnvironment: "jest-fixed-jsdom",
  testEnvironmentOptions: { customExportConditions: [""] },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}", "<rootDir>/test/**/*.test.{ts,tsx}"],
  // Each jsdom worker is memory-hungry: two workers keep the suite fast without
  // exhausting small machines (the dev servers run alongside).
  maxWorkers: 2,
  coverageProvider: "v8",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/types/**"],
};

export default createJestConfig(config);
