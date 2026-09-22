import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { availabilityReducer } from "@/features/availability/availabilitySlice";
import { authListener } from "@/features/auth/authSession";
import { authReducer } from "@/features/auth/authSlice";
import { flashReducer } from "@/features/flash/flashSlice";
import { baseApi } from "@/services/http/baseApi";

const rootReducer = combineReducers({
  availability: availabilityReducer,
  auth: authReducer,
  flash: flashReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * A new store per app instance (and per test), as recommended for Next.js:
 * no state is ever shared between requests or users.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(authListener.middleware).concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
