import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import styles from './ViewportFrame.module.css';

interface ViewportFrameProps {
  children: ReactNode;
}

/**
 * Locks the app to a 16:9 stage and letterboxes anything outside that ratio.
 * Pairs with the manifest's `orientation: landscape` hint so installed PWAs open
 * sideways on Android (iOS ignores the hint — we still cover that case with the
 * portrait overlay below).
 *
 * The rotate prompt only fires under `(orientation: portrait) and (max-width: 900px)`
 * so a desktop window in portrait gets the letterbox, while a phone held vertically
 * gets the "please rotate" overlay.
 */
export function ViewportFrame({ children }: ViewportFrameProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.letterbox}>
      <div className={styles.frame}>{children}</div>
      <div className={styles.rotatePrompt} role="alert">
        <Icon icon="pixelarticons:smartphone" className={styles.rotateIcon} />
        <h2 className={styles.rotateTitle}>
          {t('rotate.title', { defaultValue: 'Rotate Your Device' })}
        </h2>
        <p className={styles.rotateBody}>
          {t('rotate.body', {
            defaultValue: 'Pokespire is designed for landscape. Turn your device sideways to play.',
          })}
        </p>
      </div>
    </div>
  );
}
