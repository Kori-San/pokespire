import { describe, expect, it } from 'vitest';
import { drawCards, shuffle } from './deck';

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('shuffle', () => {
  it('keeps the same elements (is a permutation)', () => {
    const out = shuffle([1, 2, 3, 4, 5], seq([0.1, 0.5, 0.9, 0.3]));
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a given RNG sequence', () => {
    const a = shuffle(['a', 'b', 'c', 'd'], seq([0.2, 0.7, 0.4]));
    const b = shuffle(['a', 'b', 'c', 'd'], seq([0.2, 0.7, 0.4]));
    expect(a).toEqual(b);
  });
});

describe('drawCards', () => {
  it('draws from the top of the draw pile', () => {
    const out = drawCards({ draw: ['a', 'b', 'c'], hand: [], discard: [] }, 2, () => 0);
    expect(out.hand).toEqual(['a', 'b']);
    expect(out.draw).toEqual(['c']);
  });

  it('reshuffles the discard when the draw pile empties', () => {
    const out = drawCards({ draw: ['a'], hand: [], discard: ['b', 'c'] }, 3, () => 0);
    expect(out.hand).toHaveLength(3);
    expect([...out.hand].sort()).toEqual(['a', 'b', 'c']);
    expect(out.discard).toEqual([]);
  });

  it('stops when both piles are exhausted', () => {
    const out = drawCards({ draw: ['a'], hand: [], discard: [] }, 5, () => 0);
    expect(out.hand).toEqual(['a']);
    expect(out.draw).toEqual([]);
  });

  it('does not mutate the input piles', () => {
    const input = { draw: ['a', 'b'], hand: [], discard: [] };
    drawCards(input, 1, () => 0);
    expect(input.draw).toEqual(['a', 'b']);
    expect(input.hand).toEqual([]);
  });
});
