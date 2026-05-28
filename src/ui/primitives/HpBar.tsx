import styles from './HpBar.module.css';

interface HpBarProps {
  hp: number;
  maxHp: number;
}

export function HpBar({ hp, maxHp }: HpBarProps) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const tier = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
  return (
    <div className={styles.bar} role="img" aria-label={`HP ${hp} of ${maxHp}`}>
      <div className={styles.fill} data-tier={tier} style={{ width: `${ratio * 100}%` }} />
      <span className={styles.label}>
        {hp}/{maxHp}
      </span>
    </div>
  );
}
