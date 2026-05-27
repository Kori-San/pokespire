/** Fisher–Yates shuffle with an injected RNG (keeps it deterministic for seeded runs). */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const ai = a[i] as T;
    const aj = a[j] as T;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}

export interface Piles {
  draw: string[];
  hand: string[];
  discard: string[];
}

/**
 * Draw `count` cards into the hand, reshuffling the discard into the draw pile when it runs
 * out. Pure: returns new piles, leaving the input untouched.
 */
export function drawCards(piles: Piles, count: number, rng: () => number): Piles {
  const draw = [...piles.draw];
  const hand = [...piles.hand];
  let discard = [...piles.discard];

  for (let i = 0; i < count; i++) {
    if (draw.length === 0) {
      if (discard.length === 0) break;
      draw.push(...shuffle(discard, rng));
      discard = [];
    }
    const card = draw.shift();
    if (card === undefined) break;
    hand.push(card);
  }

  return { draw, hand, discard };
}
