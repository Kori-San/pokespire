import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enUi from './locales/en/ui.json';
import enCards from './locales/en/cards.json';
import enCardNames from './locales/en/cardNames.json';
import frUi from './locales/fr/ui.json';
import frCards from './locales/fr/cards.json';
import frCardNames from './locales/fr/cardNames.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Three namespaces so the growing pool stays manageable:
 *   - `ui`         → screen / menu / button strings (also the default).
 *   - `cards`      → effect-line templates, kinds, statuses, weather.
 *   - `cardNames`  → one entry per card, flat dictionary; the only file that grows with content.
 * Adding a 300th card costs one line in `cardNames.json` and zero in the other two.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { ui: enUi, cards: enCards, cardNames: enCardNames },
      fr: { ui: frUi, cards: frCards, cardNames: frCardNames },
    },
    ns: ['ui', 'cards', 'cardNames'],
    defaultNS: 'ui',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pokespire-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
