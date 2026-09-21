import { act, render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";

import type { Locale } from "@/lib/i18n/locales";
import en from "@/lib/i18n/messages/en.json";
import fr from "@/lib/i18n/messages/fr.json";
import { baseApi } from "@/services/http/baseApi";
import { type AppStore, makeStore, type RootState } from "@/store/store";

const MESSAGES = { en, fr };

interface IntlOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: Locale;
}

interface ProviderOptions {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  locale?: Locale;
}

type Options = IntlOptions & ProviderOptions;

/** Any missing or malformed message fails the test instead of rendering its key. */
function IntlProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="Europe/Paris"
      onError={(error) => {
        throw error;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

/** Renders a presentational component with translations only. */
export function renderWithIntl(ui: ReactElement, { locale = "en", ...options }: IntlOptions = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <IntlProvider locale={locale}>{children}</IntlProvider>;
  }

  return { user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** Renders with translations and a real store (and real RTK Query), the API being mocked by MSW. */
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = makeStore(preloadedState), locale = "en", ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IntlProvider locale={locale}>
        <Provider store={store}>{children}</Provider>
      </IntlProvider>
    );
  }

  return { store, user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** The tree renderWithProviders renders, for server rendering and hydration tests. */
export function withProviders(ui: ReactElement, { preloadedState, store = makeStore(preloadedState), locale = "en" }: ProviderOptions = {}) {
  return (
    <IntlProvider locale={locale}>
      <Provider store={store}>{ui}</Provider>
    </IntlProvider>
  );
}

/** Waits for the API calls triggered by rendering (e.g. refresh on mount) to settle. */
export async function settleApi(store: AppStore): Promise<void> {
  await act(async () => {
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
  });
}
