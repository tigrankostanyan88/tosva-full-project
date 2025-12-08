import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import fr from "./locales/fr.json";
import ch from "./locales/ch.json";

const savedLanguage = localStorage.getItem("appLanguage") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      fr: { translation: fr },
      ch: { translation: ch }
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
