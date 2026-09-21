import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";

import { type AppStore, makeStore, type RootState } from "@/store/store";

interface Options extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

/** Renders with a real store (and real RTK Query), the API being mocked by MSW. */
export function renderWithProviders(ui: ReactElement, { preloadedState, store = makeStore(preloadedState), ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}
