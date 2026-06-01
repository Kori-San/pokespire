import { useTranslation } from 'react-i18next';
import type { Keyword } from '@/data/cards';
import { Tooltip, type TooltipPlacement } from '@/ui/primitives/Tooltip';
import { KEYWORD_VISUAL, keywordLabel, keywordTooltipDesc, keywordTooltipName } from './keywords';
import { KwIcon } from './KwIcon';
import styles from './KeywordChip.module.css';

interface KeywordChipProps {
  keyword: Keyword;
  /** Where the nested keyword tooltip flies. Defaults to `right`. */
  tooltipPlacement?: TooltipPlacement;
}

/**
 * Self-contained keyword chip: icon + localised label, with a hover tooltip
 * containing the keyword's name + description (from `cards:keyword.<id>.*`).
 * Used by anything that wants the canonical Pokespire keyword visual — card
 * keyword chips, status chips in the slot tooltip, future relic mod tags.
 */
export function KeywordChip({ keyword: k, tooltipPlacement = 'right' }: KeywordChipProps) {
  const { t } = useTranslation();
  const v = KEYWORD_VISUAL[k.id];
  return (
    <Tooltip
      placement={tooltipPlacement}
      content={
        <span className={styles.tooltipEntry}>
          <span className={styles.tooltipLabel}>
            <KwIcon visual={v} className={styles.icon} />
            {keywordTooltipName(k, t)}
          </span>
          <span className={styles.tooltipDesc}>{keywordTooltipDesc(k, t)}</span>
        </span>
      }
    >
      <span className={styles.chip} data-kind={k.id}>
        <KwIcon visual={v} className={styles.icon} />
        {keywordLabel(k, t)}
      </span>
    </Tooltip>
  );
}
