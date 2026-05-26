import { useTranslation } from 'react-i18next';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { LanguageToggle } from '@/ui/primitives/LanguageToggle';
import styles from './TitleScreen.module.css';

export function TitleScreen() {
  const { t } = useTranslation();

  return (
    <div className={styles.screen}>
      <div className={styles.lang}>
        <LanguageToggle />
      </div>

      <Box className={styles.panel}>
        <h1 className={styles.logo}>POKESPIRE</h1>
        <p className={styles.tagline}>{t('title.tagline')}</p>

        <nav className={styles.menu}>
          <Button>{t('title.newGame')}</Button>
          <Button variant="ghost" disabled>
            {t('title.continue')}
          </Button>
          <Button variant="ghost" disabled>
            {t('title.pokedex')}
          </Button>
        </nav>
      </Box>
    </div>
  );
}
