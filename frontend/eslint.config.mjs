import boundaries from "eslint-plugin-boundaries";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture rules (Atomic Design + feature modules), enforced on every lint:
 *
 *   app (pages) ─► templates ─► organisms ─► molecules ─► atoms
 *        │
 *        └─► features ─► services (HTTP)      store ─► features, services
 *
 * Components are presentational: they never reach the store, the API or axios.
 */
const policies = [
  // Framework and libraries are available everywhere, except where restricted below.
  { allow: { to: { module: { origin: "external" } } } },
  { allow: { to: { module: { origin: "core" } } } },
  // Shared, dependency-free code.
  { allow: { to: { element: { types: { anyOf: ["lib", "types"] } } } } },

  // Atomic Design: each level only uses its own level and the levels below.
  { from: { element: { type: "atom" } }, allow: { to: { element: { type: "atom" } } } },
  { from: { element: { type: "molecule" } }, allow: { to: { element: { types: { anyOf: ["atom", "molecule"] } } } } },
  {
    from: { element: { type: "organism" } },
    allow: { to: { element: { types: { anyOf: ["atom", "molecule", "organism"] } } } },
  },
  {
    from: { element: { type: "template" } },
    allow: { to: { element: { types: { anyOf: ["atom", "molecule", "organism", "template"] } } } },
  },

  // Business logic.
  { from: { element: { type: "service" } }, allow: { to: { element: { type: "service" } } } },
  {
    from: { element: { type: "feature" } },
    allow: { to: { element: { types: { anyOf: ["feature", "service", "store", "atom", "molecule", "organism"] } } } },
  },
  { from: { element: { type: "store" } }, allow: { to: { element: { types: { anyOf: ["store", "feature", "service"] } } } } },

  // Pages wire data (features, store) into components.
  {
    from: { element: { type: "app" } },
    allow: {
      to: { element: { types: { anyOf: ["app", "feature", "store", "atom", "molecule", "organism", "template"] } } },
    },
  },

  // Only the HTTP layer talks to the network.
  {
    from: { element: { type: "!service" } },
    disallow: { to: { module: { origin: "external", source: "axios" } } },
  },
  // Presentational components stay store-agnostic.
  ...["react-redux", "@reduxjs/toolkit"].map((source) => ({
    from: { element: { types: { anyOf: ["atom", "molecule", "organism", "template"] } } },
    disallow: { to: { module: { origin: "external", source } } },
  })),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/elements": [
        // Each pattern designates the folder of an element; its files belong to it.
        { type: "app", pattern: "src/app" },
        { type: "atom", pattern: "src/components/atoms" },
        { type: "molecule", pattern: "src/components/molecules" },
        { type: "organism", pattern: "src/components/organisms" },
        { type: "template", pattern: "src/components/templates" },
        { type: "feature", pattern: "src/features/*" },
        { type: "store", pattern: "src/store" },
        { type: "service", pattern: "src/services/*" },
        { type: "lib", pattern: "src/lib" },
        { type: "types", pattern: "src/types" },
      ],
    },
    rules: {
      "boundaries/dependencies": ["error", { default: "disallow", checkAllOrigins: true, policies }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
