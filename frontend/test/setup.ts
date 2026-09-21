import "@testing-library/jest-dom";

import { resetNavigation } from "./mocks/nextNavigation";
import { server } from "./msw/server";

jest.mock("next/navigation", () => jest.requireActual("./mocks/nextNavigation"));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  resetNavigation();
  globalThis.localStorage?.clear(); // absent in node-environment tests
});

afterAll(() => server.close());
