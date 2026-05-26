import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import styles from './LanguageToggle.module.css';

const FLAGS: Record<Language, { label: string; Flag: () => ReactElement }> = {
  en: { label: 'English', Flag: FlagGB },
  fr: { label: 'Français', Flag: FlagFR },
};

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as Language;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (lng: Language) => {
    void i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t('common.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Globe />
      </button>

      {open && (
        <ul className={styles.menu} role="menu" aria-label={t('common.language')}>
          {SUPPORTED_LANGUAGES.map((lng) => {
            const { label, Flag } = FLAGS[lng];
            return (
              <li key={lng} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={lng === current}
                  className={lng === current ? `${styles.item} ${styles.active}` : styles.item}
                  onClick={() => choose(lng)}
                >
                  <span className={styles.flag}>
                    <Flag />
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Globe() {
  return (
    <svg
      className={styles.globe}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg
      className={styles.flagSvg}
      viewBox="0 0 3 2"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="3" height="2" fill="#fff" />
      <rect width="1" height="2" fill="#0055a4" />
      <rect x="2" width="1" height="2" fill="#ef4135" />
    </svg>
  );
}

function FlagGB() {
  return (
    <svg
      className={styles.flagSvg}
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <clipPath id="lang-uk-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#lang-uk-clip)"
        stroke="#c8102e"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}
