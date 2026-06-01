import { Fragment } from 'react';
import type { TFunction } from 'i18next';
import { KEYWORD_VISUAL, type KeywordVisual } from './keywords';
import { KwIcon } from './KwIcon';
import styles from './Card.module.css';

const VISUAL_BY_ID = KEYWORD_VISUAL as Record<string, KeywordVisual | undefined>;

/**
 * Render a keyword tooltip desc that may contain inline `{keywordId}` markers
 * (e.g. `"...le {stab} sur ce type..."`). Each marker becomes a small inline pill —
 * icon + localized label, styled via `Card.module.css :: .kwRef` — so the player
 * SEES the keyword inside the prose, and the cross-reference glossary entry
 * (added by `tooltipKeywordsOf`) provides its full definition below.
 *
 * Plain text outside the markers passes through unchanged. Unknown markers
 * (`{foo}` where `foo` isn't in `KEYWORD_VISUAL`) render as literal text — the
 * locale typo is visible instead of crashing.
 */
export function KeywordRefText({ text, t }: { text: string; t: TFunction }) {
  const parts = text.split(/(\{[a-zA-Z]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^\{([a-zA-Z]+)\}$/.exec(part);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const id = match[1];
        const visual = id ? VISUAL_BY_ID[id] : undefined;
        if (!visual || !id) return <Fragment key={i}>{part}</Fragment>;
        return (
          <span key={i} className={styles.kwRef}>
            <KwIcon visual={visual} className={styles.kwRefIcon} />
            {t(`cards:keyword.${id}.name`)}
          </span>
        );
      })}
    </>
  );
}
