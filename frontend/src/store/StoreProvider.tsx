"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";

import { restoreSession } from "@/features/auth/authSession";

import { makeStore } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  // Checked in the browser, after mount: the server renders the "unknown" state.
  useEffect(() => {
    void store.dispatch(restoreSession());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
