import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Flash {
  tone: "success" | "error";
  message: string;
}

/**
 * A message that survives one navigation: e.g. "Session created" shown on the
 * list the admin is sent back to.
 */
const flashSlice = createSlice({
  name: "flash",
  initialState: { current: null as Flash | null },
  reducers: {
    flashed(state, action: PayloadAction<Flash>) {
      state.current = action.payload;
    },
    flashCleared(state) {
      state.current = null;
    },
  },
  selectors: {
    selectFlash: (state) => state.current,
  },
});

export const { flashed, flashCleared } = flashSlice.actions;
export const { selectFlash } = flashSlice.selectors;
export const flashReducer = flashSlice.reducer;
