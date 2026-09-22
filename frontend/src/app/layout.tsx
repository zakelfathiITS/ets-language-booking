import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { ApiAvailabilityGate } from "@/features/availability/ApiAvailabilityGate";
import { StoreProvider } from "@/store/StoreProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1c" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <StoreProvider>
            <ApiAvailabilityGate>{children}</ApiAvailabilityGate>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
