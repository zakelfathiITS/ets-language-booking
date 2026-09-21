"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";

import { restoreSession } from "@/features/auth/authPersistence";

import { makeStore } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  // localStorage only exists in the browser: restore the session after mount.
  useEffect(() => {
    store.dispatch(restoreSession());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
