import { describe, expect, it } from 'vitest';
import { CARDS, STARTER_DECK } from './cards';

describe('CARDS', () => {
  it('each entry key matches its id', () => {
    for (const [key, card] of Object.entries(CARDS)) {
      expect(card.id).toBe(key);
    }
  });

  it('BALL cards carry a capture effect', () => {
    const ballCards = Object.values(CARDS).filter((c) => c.kind === 'BALL');
    expect(ballCards.length).toBeGreaterThan(0);
    for (const card of ballCards) {
      expect(card.effects.some((e) => e.kind === 'capture')).toBe(true);
    }
  });

  it('includes at least one weather card', () => {
    const hasWeather = Object.values(CARDS).some((c) =>
      c.effects.some((e) => e.kind === 'weather'),
    );
    expect(hasWeather).toBe(true);
  });
});

describe('STARTER_DECK', () => {
  it('references only real card ids', () => {
    for (const id of STARTER_DECK) {
      expect(CARDS[id]).toBeDefined();
    }
  });

  it('contains a capture ball', () => {
    expect(STARTER_DECK.some((id) => CARDS[id]?.kind === 'BALL')).toBe(true);
  });
});
