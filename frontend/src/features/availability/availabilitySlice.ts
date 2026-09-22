import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Whether the API answers. "waking" while it starts again: hosted on a free
 * plan, it is paused after a while without traffic and takes up to a minute
 * to come back.
 */
export type ApiAvailability = "checking" | "waking" | "ready";

const availabilitySlice = createSlice({
  name: "availability",
  initialState: { status: "checking" as ApiAvailability },
  reducers: {
    availabilityChanged(state, action: PayloadAction<Exclude<ApiAvailability, "checking">>) {
      state.status = action.payload;
    },
  },
  selectors: {
    selectApiAvailability: (state) => state.status,
  },
});

export const { availabilityChanged } = availabilitySlice.actions;
export const { selectApiAvailability } = availabilitySlice.selectors;
export const availabilityReducer = availabilitySlice.reducer;
