import { describe, expect, it } from 'vitest';
import { CARDS, STARTER_DECK } from './cards';

describe('CARDS', () => {
  it('each entry key matches its id', () => {
    for (const [key, card] of Object.entries(CARDS)) {
      expect(card.id).toBe(key);
    }
  });

  it('includes at least one weather card', () => {
    const hasWeather = Object.values(CARDS).some((c) =>
      c.effects.some((e) => e.kind === 'weather'),
    );
    expect(hasWeather).toBe(true);
  });

  it('no card carries a capture effect anymore — captures live in the inventory layer', () => {
    const captureCards = Object.values(CARDS).filter((c) =>
      c.effects.some((e) => e.kind === 'capture'),
    );
    expect(captureCards).toHaveLength(0);
  });
});

describe('STARTER_DECK', () => {
  it('references only real card ids', () => {
    for (const id of STARTER_DECK) {
      expect(CARDS[id]).toBeDefined();
    }
  });

  it('contains no BALL or ITEM cards — those moved to the inventory layer', () => {
    for (const id of STARTER_DECK) {
      const kind = CARDS[id]?.kind;
      expect(kind === 'ATK' || kind === 'SKL' || kind === 'PWR').toBe(true);
    }
  });
});
