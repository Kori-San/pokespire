# Combat formula

## Damage

```
final = round(
  card.amount                               // printed damage on the card
  × stab                                    // 1.25 if card.type ∈ attacker.types else 1.0
  × eff                                     // 18×18 type chart; immunity → 0.25 floor
  × weakMod                                 // status modifiers (BURN/WEAK/…)
  × weatherMod                              // sun / rain / sand / hail multipliers
  × itemMod                                 // held-item post-multipliers
  × levelScale(lvl)                         // 0.5 + lvl × 0.05  → L5=0.75, L20=1.50, L50=3.00
  × atkScale(category)                      // physical: atk / 75 ;  special: spAtk / 75   (clamp 0.7–1.5)
  × defScale(category)                      // physical: 75 / def ;  special: 75 / spDef    (clamp 0.7–1.5)
)
// 75 ≈ Gen 1 average stat baseline
```

**Deterministic** — no random factor — so seeded runs reproduce exactly. Lives in
[`src/game/combat/damage.ts`](../src/game/combat/damage.ts) as a pure function. Block
subtraction is the reducer's job.

### Display = final

The card shows the **final** number — what actually lands. No hidden split between
"displayed" and "real" damage. Tooltip reveals the full multiplier chain for the curious.

### Physical / special split

Canonical Gen-IV split. `card.category` selects which stat pair the formula reads:

| `category` | `atkScale` reads  | `defScale` reads | Example cards                                      |
| ---------- | ----------------- | ---------------- | -------------------------------------------------- |
| `physical` | `attacker.atk`    | `defender.def`   | Tackle, Vine Whip, Double Kick, Quick Attack       |
| `special`  | `attacker.spAtk`  | `defender.spDef` | Ember, Water Gun, Thunder Shock, Confusion, Gust   |
| `status`   | _n/a_ (no damage) | _n/a_            | Harden, Recover, Sunny Day, Sword Dance, BALL/ITEM |

The HGSS icon on the card banner ([`public/sprites/move-category/`](../public/sprites/move-category/))
tells the player at a glance: orange star = physical, purple swirl = special, gray dots = status.

### STAB applies to damage ONLY

A Flying-type playing REST does not heal more. A Water-type playing PROTECT does not block
harder. A Dragon-type playing DRAGON DANCE does not gain more stages. STAB enters the
formula at `× stab` on the damage path and nowhere else. The same goes for type
effectiveness — heal/block/buff/status effects are matchup-agnostic.

### Stat stages (`-6 … +6`)

Each Combatant tracks five stage counters: `atk`, `def`, `spAtk`, `spDef`, `spd`. Cards
like Swords Dance, Dragon Dance, Calm Mind, Iron Defense, Agility, Growl, Leer change
them. Canonical Gen-III multiplier table:

| Stage | Multiplier | Stage | Multiplier |
| ----- | ---------- | ----- | ---------- |
| +6    | ×4.0       | -1    | ×0.67      |
| +5    | ×3.5       | -2    | ×0.50      |
| +4    | ×3.0       | -3    | ×0.40      |
| +3    | ×2.5       | -4    | ×0.33      |
| +2    | ×2.0       | -5    | ×0.29      |
| +1    | ×1.5       | -6    | ×0.25      |
| 0     | ×1.0       |       |            |

Stages multiply the base stat **before** the `/75` clamp:
`atkScale = clamp((atk × stageMod) / 75, 0.7, 1.5)`. So Swords Dance (+2 atk) on a 75-atk
mon doubles its effective atk into the clamp — readable, capped, never unbounded.

**Reset rules (per canon):**

- Stages reset to **0 on switch-out** — bench mons store nothing.
- Stages reset to **0 at combat end** — the run-power-curve lever is levels and items, not stages.
- Statuses (BURN/WEAK/…) follow the same reset rules.

### Immunity floor

Type immunities (eff = 0) are clamped to **×0.25** so a card still chips rather than
being a dead no-op — except where a card is flagged a true no-effect for UX clarity.

## Turn order (speed)

`effectiveSpeed = baseStats.spd × speedStageMod`. At the start of each turn the faster
combatant acts first.

- **You're faster:** play cards, then enemy intent resolves at end of turn (today's
  behavior).
- **You're slower:** enemy intent resolves FIRST — your block plans for the turn arrive
  too late for that hit. Drafting Agility or Dragon Dance becomes a real lever.

**Switching does NOT grant the enemy a free strike.** Canon says it should; in Pokespire
the 1-energy switch cost is already the brake — anyone abusing switch-to-attack pays
2 energy per attack, which limits itself. Keeps the switch decision crisp.

## Worked examples

Card "EMBER LASH" — FIRE, special, prints **10**. Defender neutral baseline (def 75, spDef 75) unless noted.

| Attacker            | Lvl | Match              | STAB | eff | atkScale | defScale | final |
| ------------------- | --- | ------------------ | ---- | --- | -------- | -------- | ----- |
| Charmander (spA 60) | 5   | Rattata (spD 35)   | 1.25 | 1.0 | 0.80     | 1.50     | 9     |
| Charmander          | 10  | Rattata            | 1.25 | 1.0 | 0.80     | 1.50     | 12    |
| Charmeleon (spA 80) | 16  | Onix (spD 45)      | 1.25 | 1.0 | 1.07     | 1.50     | 20    |
| Charizard (spA 109) | 36  | Onix               | 1.25 | 1.0 | 1.45     | 1.50     | 65    |
| Charmander          | 5   | Bulbasaur (spD 65) | 1.25 | 2.0 | 0.80     | 1.15     | 17    |
| Mewtwo (spA 154)    | 5   | Rattata            | 1.0  | 1.0 | 1.50     | 1.50     | 17    |

Reads: STAB baseline ≈ printed value at L5; STAB + super-effective stacks fast; Charizard
late-run vs Onix is huge because Onix's special-defense is paper (the physical/special
split now rewards picking Special cards into physically-bulky mons); Mewtwo from L5
already out-damages a starter without STAB.

## Capture

Uses the **real Gen III/IV formula** so chances feel authentic — including a small
catch chance even at full HP.

```
a = ((3·maxHP − 2·HP) · catchRate · ballBonus · shinyBonus) / (3·maxHP) · statusBonus
if a ≥ 255 → guaranteed
else  perShake = 1048560 / (16711680 / a)^(1/4) / 65536
      chance   = perShake^4          // four shakes must all pass
```

- **Balls:** Poké Ball (×1) < Great Ball (×1.5) < Ultra Ball (×2) < Master Ball (guaranteed). FR names: Poké Ball / Super Ball / Hyper Ball / Master Ball.
- `catchRate` is the species' PokéAPI `capture_rate` (0–255). The HP term keeps a baseline at full HP and rises as HP drops.
- Shiny → `shinyBonus` ×5 (see [shinies.md](shinies.md)). Status (sleep/freeze ×2.5, etc.) is a hooked `statusBonus`.
- On success: joins the team at the enemy's current level, full HP, no statuses (team-full → release/skip modal). Solo runs: capture is dex-only.

## Effectiveness display (UX)

Cards show the **computed** value for the live matchup with a tag: SUPER (green) /
effective / STAB (yellow border) / neutral / resisted (gray) / NO EFFECT (red 0, desaturated).
Hover/hold reveals the multiplier breakdown. Recomputes on switch, status, weather,
stat-stage, level-up.
