# Weather

`CombatState.weather?: { kind: 'sun'|'rain'|'sand'|'hail'|null, turnsLeft: number }`.
Four cards (SUNNY DAY, RAIN DANCE, SANDSTORM, HAIL — SKL, cost 1) set weather for 4 turns.
Computed as a multiplier in `damage.ts`; chip damage ticks in `statusTick.ts`. Stacks with
STAB + effectiveness.

| Weather   | Effect                                                         |
| --------- | -------------------------------------------------------------- |
| Sun       | FIRE ×1.5, WATER ×0.5.                                         |
| Rain      | WATER ×1.5, FIRE ×0.5.                                         |
| Sandstorm | ROCK/GROUND/STEEL +20%. Others take 5 chip dmg at end of turn. |
| Hail      | ICE +20%. Non-ICE take 5 chip dmg at end of turn.              |

A WeatherIndicator shows the active weather and remaining turns.
