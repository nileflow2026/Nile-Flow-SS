import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useEffect, useState } from "react";
import ar from "./locales/ar.json";
import br from "./locales/br.json";
import dk from "./locales/dk.json";
import en from "./locales/en.json";
import kis from "./locales/kis.json";
import nr from "./locales/nr.json";
import src from "./locales/src.json";

const LANGUAGE_KEY = "app_language";

const i18n = new I18n({
  en,
  ar,
  kis,
  src,
  nr,
  dk,
  br,
});

i18n.enableFallback = true;

// Listener set — components subscribe via useLanguage() to re-render on locale change
const listeners = new Set();
const notifyListeners = (lang) => listeners.forEach((cb) => cb(lang));

export const useLanguage = () => {
  const [locale, setLocale] = useState(i18n.locale);
  useEffect(() => {
    listeners.add(setLocale);
    return () => listeners.delete(setLocale);
  }, []);
  return locale;
};

export const initializeLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    const lang =
      storedLanguage || Localization.getLocales()[0]?.languageCode || "en";
    i18n.locale = lang;
    notifyListeners(lang);
  } catch (error) {
    console.error("Error initializing language:", error);
    i18n.locale = "en";
  }
};

export const changeLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    i18n.locale = lang;
    notifyListeners(lang);
  } catch (error) {
    console.error("Error changing language:", error);
  }
};

export default i18n;
/*  "package": "com.nilemartsouthsudan.app" */
