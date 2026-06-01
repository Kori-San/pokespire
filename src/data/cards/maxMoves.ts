import type { CardDef, PokeType } from '@/types';

/**
 * Gen-VIII Max Moves — the synthetic cards a dynamaxed Pokémon plays in place of its
 * regular hand. Per pokepedia canon: every attack card becomes the typed Max move
 * (`MAX_MOVES[card.type]`) and every status card becomes the universal `MAX_GUARD`.
 *
 * Each Max move carries:
 *   - **Fixed base damage** (D2 default = 18). Pokespire doesn't read the source
 *     card's amount; the Max version normalises the power so the dynamax window feels
 *     consistent across the deck. Future relics can scale this.
 *   - **A canonical secondary effect** matching the type's pokepedia entry — weather
 *     summon, terrain set, stat bump on self / column, or stat lower on foe. Wired
 *     in D3; the D2 baseline ships damage-only for the secondary stage to layer onto.
 *
 * These cards live in `CARDS` so the reducer / selectors can resolve their ids, but
 * they're explicitly excluded from reward pools and starter decks — they only ever
 * appear in hand via `effectiveCardFor` while the active mon is dynamaxed.
 */

const MAX_DAMAGE = 18;

/** Universal Max Guard — replaces every SKL/PWR card while dynamaxed. */
export const MAX_GUARD: CardDef = {
  id: 'maxGuard',
  name: 'MAX GUARD',
  type: 'normal',
  cost: 1,
  kind: 'SKL',
  category: 'status',
  rarity: 'epic',
  theme: 'dynamax',
  effects: [{ kind: 'block', amount: 14, scope: 'self' }],
};

/**
 * Typed Max moves keyed by the source card's type. Each entry replaces every ATK card
 * of that type while the active mon is dynamaxed. `id` matches `cardNames:` so the
 * banner localises; `name` is the English fallback.
 */
export const MAX_MOVES: Record<PokeType, CardDef> = {
  normal: {
    id: 'maxStrike',
    name: 'MAX STRIKE',
    type: 'normal',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Pokepedia: Normalomax → "Baisse la Vitesse de la cible".
      { kind: 'stat', target: 'foe', stat: 'spd', stages: -1 },
    ],
  },
  fire: {
    id: 'maxFlare',
    name: 'MAX FLARE',
    type: 'fire',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Pyromax → summons sunlight (3 turns canon, mirroring Sunny Day).
      { kind: 'weather', weather: 'sun', turns: 3 },
    ],
  },
  water: {
    id: 'maxGeyser',
    name: 'MAX GEYSER',
    type: 'water',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'weather', weather: 'rain', turns: 3 },
    ],
  },
  electric: {
    id: 'maxLightning',
    name: 'MAX LIGHTNING',
    type: 'electric',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'terrain', terrain: 'electric', turns: 3 },
    ],
  },
  grass: {
    id: 'maxOvergrowth',
    name: 'MAX OVERGROWTH',
    type: 'grass',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'terrain', terrain: 'grassy', turns: 3 },
    ],
  },
  ice: {
    id: 'maxHailstorm',
    name: 'MAX HAILSTORM',
    type: 'ice',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'weather', weather: 'hail', turns: 3 },
    ],
  },
  fighting: {
    id: 'maxKnuckle',
    name: 'MAX KNUCKLE',
    type: 'fighting',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Pugilomax → boosts user's Attack.
      { kind: 'stat', target: 'self', stat: 'atk', stages: 1 },
    ],
  },
  poison: {
    id: 'maxOoze',
    name: 'MAX OOZE',
    type: 'poison',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Toxinomax → boosts user's Sp. Atk.
      { kind: 'stat', target: 'self', stat: 'spAtk', stages: 1 },
    ],
  },
  ground: {
    id: 'maxQuake',
    name: 'MAX QUAKE',
    type: 'ground',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Sismomax → boosts allies' Sp. Def (column scope).
      { kind: 'stat', target: 'self', stat: 'spDef', stages: 1, scope: 'column' },
    ],
  },
  flying: {
    id: 'maxAirstream',
    name: 'MAX AIRSTREAM',
    type: 'flying',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Aéromax → boosts user's Speed.
      { kind: 'stat', target: 'self', stat: 'spd', stages: 1 },
    ],
  },
  psychic: {
    id: 'maxMindstorm',
    name: 'MAX MINDSTORM',
    type: 'psychic',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'terrain', terrain: 'psychic', turns: 3 },
    ],
  },
  bug: {
    id: 'maxFlutterby',
    name: 'MAX FLUTTERBY',
    type: 'bug',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Insectomax → lowers target's Sp. Atk.
      { kind: 'stat', target: 'foe', stat: 'spAtk', stages: -1 },
    ],
  },
  rock: {
    id: 'maxRockfall',
    name: 'MAX ROCKFALL',
    type: 'rock',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'weather', weather: 'sand', turns: 3 },
    ],
  },
  ghost: {
    id: 'maxPhantasm',
    name: 'MAX PHANTASM',
    type: 'ghost',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Spectromax → lowers target's Defense.
      { kind: 'stat', target: 'foe', stat: 'def', stages: -1 },
    ],
  },
  dragon: {
    id: 'maxWyrmwind',
    name: 'MAX WYRMWIND',
    type: 'dragon',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Dracomax → lowers target's Attack.
      { kind: 'stat', target: 'foe', stat: 'atk', stages: -1 },
    ],
  },
  dark: {
    id: 'maxDarkness',
    name: 'MAX DARKNESS',
    type: 'dark',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Sinistromax → lowers target's Sp. Def.
      { kind: 'stat', target: 'foe', stat: 'spDef', stages: -1 },
    ],
  },
  steel: {
    id: 'maxSteelspike',
    name: 'MAX STEELSPIKE',
    type: 'steel',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      // Métallomax → boosts allies' Defense (column scope).
      { kind: 'stat', target: 'self', stat: 'def', stages: 1, scope: 'column' },
    ],
  },
  fairy: {
    id: 'maxStarfall',
    name: 'MAX STARFALL',
    type: 'fairy',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'epic',
    theme: 'dynamax',
    effects: [
      { kind: 'damage', amount: MAX_DAMAGE },
      { kind: 'terrain', terrain: 'misty', turns: 3 },
    ],
  },
};

/** Flat list of every synthetic Max card — registered in `CARDS` so the engine can resolve ids. */
export const MAX_CARDS: CardDef[] = [MAX_GUARD, ...Object.values(MAX_MOVES)];
