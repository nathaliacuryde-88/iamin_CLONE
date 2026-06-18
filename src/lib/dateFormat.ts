import { format as fnsFormat, formatDistanceToNow as fnsDistance } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/lib/i18n";

function currentLocale() {
  return i18n.language?.startsWith("de") ? de : enUS;
}

export function format(date: Date | number, fmt: string, options?: any) {
  return fnsFormat(date, fmt, { locale: currentLocale(), ...(options ?? {}) });
}

export function formatDistanceToNow(date: Date | number, options?: any) {
  return fnsDistance(date, { locale: currentLocale(), ...(options ?? {}) });
}
