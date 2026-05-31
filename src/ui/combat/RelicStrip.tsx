import { useTranslation } from 'react-i18next';
import { type HeldItemId, heldItemIconUrl } from '@/data/heldItems';
import { Tooltip } from '@/ui/primitives/Tooltip';
import styles from './RelicStrip.module.css';

interface RelicStripProps {
  relics: readonly HeldItemId[];
}

/**
 * Horizontal row of held-item icons. Unlike StS, the count is unbounded so we don't
 * render empty slots — only the relics the player owns. Hovering an icon pops a
 * Tooltip below with the item's name and effect.
 */
export function RelicStrip({ relics }: RelicStripProps) {
  const { t } = useTranslation();

  if (relics.length === 0) return null;

  return (
    <div className={styles.strip} role="list">
      {relics.map((id) => (
        <Tooltip
          key={id}
          placement="bottomLeft"
          content={
            <>
              <div className={styles.tooltipName}>{t(`heldItem.${id}.name`)}</div>
              <div className={styles.tooltipDesc}>{t(`heldItem.${id}.desc`)}</div>
            </>
          }
        >
          <span
            className={styles.relic}
            role="listitem"
            aria-label={t(`heldItem.${id}.name`, { defaultValue: id })}
          >
            <img className={styles.relicIcon} src={heldItemIconUrl(id)} alt="" />
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
