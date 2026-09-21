import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { EmptyState } from "@/components/molecules/EmptyState";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <EmptyState icon={Compass} title={t("title")} description={t("description")} action={<ButtonLink href="/">{t("home")}</ButtonLink>} />
    </main>
  );
}
