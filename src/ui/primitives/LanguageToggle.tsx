import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import styles from './LanguageToggle.module.css';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as Language;

  return (
    <div className={styles.toggle} role="group" aria-label="Language">
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          className={lng === current ? `${styles.option} ${styles.active}` : styles.option}
          aria-pressed={lng === current}
          onClick={() => void i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
