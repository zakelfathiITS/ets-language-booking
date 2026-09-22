import { baseApi } from "@/services/http/baseApi";
import type { AppDispatch } from "@/store/store";

import { availabilityChanged } from "./availabilitySlice";

const healthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHealth: build.query<{ status: string }, void>({ query: () => ({ url: "/api/health" }) }),
  }),
});

export interface WaitTiming {
  /** A quick answer shows nothing; past this delay, the "waking up" screen appears. */
  noticeAfterMs: number;
  retryEveryMs: number;
}

const TIMING: WaitTiming = { noticeAfterMs: 2500, retryEveryMs: 3000 };

/** Resolves once the API answers its health check, asking again until it does. */
export function waitForApi(timing: WaitTiming = TIMING) {
  return async (dispatch: AppDispatch): Promise<void> => {
    const notice = setTimeout(() => dispatch(availabilityChanged("waking")), timing.noticeAfterMs);

    try {
      for (;;) {
        const { error } = await dispatch(healthApi.endpoints.getHealth.initiate(undefined, { subscribe: false, forceRefetch: true }));
        if (!error) {
          break;
        }

        dispatch(availabilityChanged("waking"));
        await new Promise((resolve) => setTimeout(resolve, timing.retryEveryMs));
      }
    } finally {
      clearTimeout(notice);
    }

    dispatch(availabilityChanged("ready"));
  };
}
