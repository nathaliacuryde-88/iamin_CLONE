import { useTranslation } from "react-i18next";
import { de, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("de") ? de : enUS;
}
