# Combat formula

## Damage

```
final = round(
  card.amount                               // printed damage on the card
  × stab                                    // 1.25 if card.type ∈ attacker.types else 1.0
  × eff                                     // 18×18 type chart; immunity → 0.25 floor
  × weakMod                                 // status modifiers (BURN/WEAK/…)
  × weatherMod                              // sun/rain/sand/hail multipliers
  × itemMod                                 // held-item post-multipliers
  × levelScale(lvl)                         // 0.5 + lvl × 0.05  → L5=0.75, L20=1.50, L50=3.00
  × clamp(attacker.baseAtk / 75, 0.7, 1.5)  // species attack flavor
  × clamp(75 / defender.baseDef, 0.7, 1.5)  // species defense flavor
)
// 75 ≈ Gen 1 average atk/def baseline
```

**Deterministic** — no random factor — so seeded runs reproduce exactly. Lives in
`src/game/combat/damage.ts` as a pure function. Block subtraction is the reducer's job.

### Why this, not the real Pokémon formula

The real formula uses move _Power_ as input and randomizes ×0.85–1.00. In a deckbuilder
that breaks card readability ("Deal 10" should land for ~10). This formula keeps printed
numbers meaningful at low levels while letting level + species stats both matter, and
stays deterministic for save/resume.

### Immunity floor

Type immunities (eff = 0) are clamped to **×0.25** so a card still chips rather than
being a dead no-op — except where a card is flagged a true no-effect for UX clarity.

## Worked examples

Card "EMBER LASH" — FIRE, prints **10**. Defender neutral baseline (def 75) unless noted.

| Attacker            | Lvl | Match              | STAB | eff | final |
| ------------------- | --- | ------------------ | ---- | --- | ----- |
| Charmander (atk 52) | 5   | Rattata (def 35)   | 1.25 | 1.0 | 10    |
| Charmander          | 10  | Rattata            | 1.25 | 1.0 | 13    |
| Charmeleon (atk 64) | 16  | Onix (def 160)     | 1.25 | 0.5 | 5     |
| Charizard (atk 84)  | 36  | Onix (def 160)     | 1.25 | 0.5 | 13    |
| Charmander          | 5   | Bulbasaur (def 49) | 1.25 | 2.0 | 20    |
| Mewtwo (atk 110)    | 5   | Rattata            | 1.0  | 1.0 | 17    |

Reads: STAB baseline ≈ printed value; STAB + super-effective stacks high; bulky resistant
foes (Onix) force a switch; legendaries hit hard from L5 (balanced elsewhere — see
[legendaries.md](legendaries.md)).

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
effective / STAB (yellow) / neutral / resisted (gray) / NO EFFECT (red 0, desaturated).
Hover/hold reveals the multiplier breakdown. Recomputes on switch, status, weather, level-up.
