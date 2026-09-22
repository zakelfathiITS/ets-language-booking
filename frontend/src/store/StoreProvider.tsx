"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";

import { restoreSession } from "@/features/auth/authSession";
import { waitForApi } from "@/features/availability/waitForApi";

import { makeStore } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  // Checked in the browser, after mount: the server renders the "unknown" state.
  // The session is only checked once the API answers: an API still waking up
  // must not look like a signed-out user.
  useEffect(() => {
    void (async () => {
      await store.dispatch(waitForApi());
      await store.dispatch(restoreSession());
    })();
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
