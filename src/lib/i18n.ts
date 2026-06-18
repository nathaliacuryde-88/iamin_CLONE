import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en.json";
import de from "@/locales/de.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: typeof window !== "undefined" ? (localStorage.getItem("i18nextLng") ?? "en") : "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      // Only honor an explicit user choice stored in localStorage; never
      // auto-detect from the browser language so the default stays English.
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

const syncHtmlLang = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng.startsWith("de") ? "de" : "en";
  }
};
syncHtmlLang(i18n.language || "en");
i18n.on("languageChanged", syncHtmlLang);

export const setLanguage = (lng: SupportedLanguage) => {
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem("i18nextLng", lng);
  } catch {}
};

export default i18n;
