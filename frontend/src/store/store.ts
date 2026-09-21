import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { authListener } from "@/features/auth/authPersistence";
import { authReducer } from "@/features/auth/authSlice";
import { baseApi } from "@/services/http/baseApi";

const rootReducer = combineReducers({
  auth: authReducer,
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
