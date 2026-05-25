// Pokespire — combat, GBA-era, with team + switch + STAB + type-effectiveness.
(function () {
var { useState, useEffect, useRef } = React;
var {
  PixSprite, CreatureSprite, PixBox, PixButton, NamePlate,
  PixCard, EnergyPip, BattleBackdrop, Platform, IntentBadge,
  TeamSlot, DamageModBadge,
} = window;
var P = window.PAL;

// ─── helpers ─────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollIntent() {
  const r = Math.random();
  if (r < 0.55) return { type:'attack', value: 4 + Math.floor(Math.random()*5) };
  if (r < 0.85) return { type:'defend', value: 5 };
  return { type:'buff', value: 0 };
}

function makeTeam(ids) {
  return ids.map(id => {
    const c = window.CREATURES[id];
    return { creatureId: id, hp: c.hp, maxHp: c.hp, statuses: {}, block: 0 };
  });
}

function makeFreshState({ teamIds, enemyId }) {
  const enemy = window.ENEMIES[enemyId];
  return {
    team: makeTeam(teamIds),
    activeIdx: 0,
    enemy: { creatureId: enemyId, hp: enemy.hp, maxHp: enemy.hp, block: 0, statuses: {}, intent: rollIntent() },
    energy: 3, maxEnergy: 3,
    hand: [],
    drawPile: shuffle(window.STARTER_DECK),
    discardPile: [],
    log: [`A wild ${enemy.name} appeared!`],
    over: null,
    turn: 1,
  };
}

const SWITCH_COST = 1;

function CombatScene({
  teamIds = window.STARTER_TEAM,
  enemyId = 'rootlet',
  width = 920, height = 600,
}) {
  const [state, setState] = useState(() => makeFreshState({ teamIds, enemyId }));
  const [animEnemy, setAnimEnemy] = useState(false);
  const [animPlayer, setAnimPlayer] = useState(false);
  const [floaty, setFloaty] = useState(null);
  const [modBadge, setModBadge] = useState(null); // { stab, effectiveness }
  const [switchAnim, setSwitchAnim] = useState(false);

  useEffect(() => {
    setState(s => drawCards(s, 5));
    // eslint-disable-next-line
  }, []);

  function drawCards(s, n) {
    let { drawPile, discardPile, hand } = s;
    drawPile = [...drawPile]; discardPile = [...discardPile]; hand = [...hand];
    for (let i = 0; i < n; i++) {
      if (drawPile.length === 0) {
        if (discardPile.length === 0) break;
        drawPile = shuffle(discardPile);
        discardPile = [];
      }
      hand.push(drawPile.shift());
      if (hand.length >= 8) break;
    }
    return { ...s, drawPile, discardPile, hand };
  }

  function floatText(who, text, color) {
    setFloaty({ who, text, color, key: Math.random() });
    setTimeout(() => setFloaty(null), 850);
  }

  function showMods(mods) {
    if (mods.stab <= 1 && Math.abs(mods.effectiveness - 1) < 0.05) return;
    setModBadge({ ...mods, key: Math.random() });
    setTimeout(() => setModBadge(null), 1100);
  }

  function activeMember(s = state) {
    return s.team[s.activeIdx];
  }

  function doSwitch(idx) {
    if (state.over) return;
    if (idx === state.activeIdx) return;
    if (state.team[idx].hp <= 0) {
      setState(s => ({ ...s, log: [...s.log.slice(-3), 'That creature has fainted!'] }));
      return;
    }
    if (state.energy < SWITCH_COST) {
      setState(s => ({ ...s, log: [...s.log.slice(-3), 'Not enough energy to switch!'] }));
      return;
    }
    setSwitchAnim(true);
    setTimeout(() => setSwitchAnim(false), 280);
    setState(s => {
      const team = s.team.map((m, i) =>
        i === s.activeIdx ? { ...m, block: 0 } : m
      );
      const newName = window.CREATURES[team[idx].creatureId].name;
      const oldName = window.CREATURES[team[s.activeIdx].creatureId].name;
      return {
        ...s,
        team,
        activeIdx: idx,
        energy: s.energy - SWITCH_COST,
        log: [...s.log.slice(-3), `${oldName}, come back! Go, ${newName}!`],
      };
    });
  }

  function playCard(idx) {
    if (state.over) return;
    const cardId = state.hand[idx];
    const card = window.CARDS_BY_ID[cardId];
    if (!card) return;
    if (card.cost > state.energy) {
      setState(s => ({ ...s, log: [...s.log.slice(-3), 'Not enough energy!'] }));
      return;
    }

    setState(s => {
      const team = s.team.map(m => ({ ...m, statuses: { ...m.statuses } }));
      let active = { ...team[s.activeIdx], statuses: { ...team[s.activeIdx].statuses } };
      team[s.activeIdx] = active;
      let enemy = { ...s.enemy, statuses: { ...s.enemy.statuses } };

      let { energy, hand, discardPile, log } = s;
      energy -= card.cost;
      hand = [...hand]; hand.splice(idx, 1);
      discardPile = [...discardPile, cardId];

      const newLog = [...log];
      const activeCr = window.CREATURES[active.creatureId];
      const enemyCr = window.ENEMIES[enemy.creatureId];

      if (card.kind === 'ATK') {
        const mods = window.calcDamageMods(card.type, activeCr.type, 'NORMAL');
        let dmg = Math.round(card.dmg * mods.mult);
        if (active.statuses.weak) dmg = Math.floor(dmg * 0.75);
        const absorbed = Math.min(enemy.block, dmg);
        enemy.block -= absorbed;
        const through = dmg - absorbed;
        enemy.hp = Math.max(0, enemy.hp - through);
        newLog.push(`${activeCr.name} used ${card.name}!`);
        floatText('enemy', `-${through}`, '#e84050');
        showMods(mods);
        setAnimEnemy(true); setTimeout(() => setAnimEnemy(false), 220);
        if (card.id === 'cinderlash') enemy.statuses.burn = (enemy.statuses.burn || 0) + 1;
        if (card.id === 'vinesnare')  enemy.statuses.weak = (enemy.statuses.weak || 0) + 1;
      } else if (card.kind === 'SKL') {
        if (card.block) {
          active.block += card.block;
          floatText('player', `+${card.block}`, '#5878c8');
          newLog.push(`Gained ${card.block} BLOCK.`);
        }
        if (card.id === 'photoheal') {
          const heal = Math.min(4, active.maxHp - active.hp);
          active.hp += heal;
          floatText('player', `+${heal}`, '#48b048');
          newLog.push(`Healed ${heal} HP.`);
        }
        let next = { ...s, team, energy, hand, discardPile, enemy, log: newLog };
        if (card.id === 'foresight') next = drawCards(next, 2);
        if (card.id === 'shadowstep') next = drawCards(next, 1);
        return { ...next, log: next.log.slice(-4) };
      } else if (card.kind === 'ORB') {
        const chance = window.calcCaptureChance(card.id, enemy.hp, enemy.maxHp);
        const pct = Math.round(chance * 100);
        if (Math.random() < chance && enemy.hp > 0) {
          newLog.push(`Captured ${enemyCr.name}! (${pct}%)`);
          return { ...s, team, energy, hand, discardPile, enemy, log: newLog, over:'win-capture' };
        } else {
          newLog.push(`It broke free! (${pct}% chance)`);
          floatText('enemy', '!', '#f8f8f8');
        }
      } else if (card.kind === 'PWR') {
        active.statuses.flarecore = (active.statuses.flarecore || 0) + 1;
        newLog.push('FLARECORE activated.');
      }

      let over = s.over;
      if (enemy.hp <= 0) { over = 'win-defeat'; newLog.push('Foe fainted!'); }

      return { ...s, team, energy, hand, discardPile, enemy, log: newLog.slice(-4), over };
    });
  }

  function endTurn() {
    if (state.over) return;
    setState(s => {
      const team = s.team.map(m => ({ ...m, statuses: { ...m.statuses } }));
      const active = { ...team[s.activeIdx], statuses: { ...team[s.activeIdx].statuses } };
      team[s.activeIdx] = active;
      const enemy = { ...s.enemy, statuses: { ...s.enemy.statuses } };
      const newLog = [...s.log];

      // discard hand
      let discardPile = [...s.discardPile, ...s.hand];
      let hand = [];

      // burn ticks on enemy
      if (enemy.statuses.burn) {
        enemy.hp = Math.max(0, enemy.hp - enemy.statuses.burn);
        floatText('enemy', `-${enemy.statuses.burn}`, '#f08850');
        newLog.push(`BURN: -${enemy.statuses.burn} HP`);
      }
      // flarecore
      if (active.statuses.flarecore) {
        const dmg = 2 * active.statuses.flarecore;
        const absorbed = Math.min(enemy.block, dmg);
        enemy.block -= absorbed;
        enemy.hp = Math.max(0, enemy.hp - (dmg - absorbed));
        newLog.push(`FLARECORE: -${dmg} HP`);
      }

      // enemy attacks active member, type effectiveness vs ITS type
      if (enemy.hp > 0) {
        const intent = enemy.intent;
        if (intent.type === 'attack') {
          let dmg = intent.value;
          const absorbed = Math.min(active.block, dmg);
          active.block -= absorbed;
          const through = dmg - absorbed;
          active.hp = Math.max(0, active.hp - through);
          newLog.push(`Foe attacks ${window.CREATURES[active.creatureId].name}! -${through} HP`);
          floatText('player', `-${through}`, '#e84050');
          setAnimPlayer(true); setTimeout(() => setAnimPlayer(false), 220);
        } else if (intent.type === 'defend') {
          enemy.block += intent.value;
          newLog.push(`Foe braces. +${intent.value} BLK`);
        } else {
          enemy.statuses.strength = (enemy.statuses.strength || 0) + 1;
          newLog.push('Foe gathers strength.');
        }
      }

      // clear block + tick statuses
      active.block = 0;
      ['burn','weak'].forEach(k => {
        if (active.statuses[k]) {
          active.statuses[k] -= 1;
          if (active.statuses[k] <= 0) delete active.statuses[k];
        }
        if (enemy.statuses[k]) {
          enemy.statuses[k] -= 1;
          if (enemy.statuses[k] <= 0) delete enemy.statuses[k];
        }
      });
      enemy.intent = rollIntent();

      let over = s.over;
      if (active.hp <= 0) {
        // auto-switch to next non-fainted member
        const next = team.findIndex((m, i) => i !== s.activeIdx && m.hp > 0);
        if (next >= 0) {
          newLog.push(`${window.CREATURES[active.creatureId].name} fainted!`);
          newLog.push(`Go, ${window.CREATURES[team[next].creatureId].name}!`);
          let nextState = { ...s, team, hand, discardPile, enemy,
            activeIdx: next, energy: s.maxEnergy,
            log: newLog.slice(-4), turn: s.turn+1, over };
          return drawCards(nextState, 5);
        } else {
          over = 'lose';
          newLog.push('Your team blacked out…');
        }
      }
      if (enemy.hp <= 0) { over = 'win-defeat'; newLog.push('Foe fainted!'); }

      let next = { ...s, team, hand, discardPile, enemy,
        energy: s.maxEnergy, log: newLog.slice(-4), turn: s.turn+1, over };
      next = drawCards(next, 5);
      return next;
    });
  }

  function reset() {
    setState(makeFreshState({ teamIds, enemyId }));
    setTimeout(() => setState(s => drawCards(s, 5)), 10);
  }

  // ─── derived for render ────────────────────────────────────
  const active = activeMember();
  const playerCreature = window.CREATURES[active.creatureId];
  const enemyCreature = window.ENEMIES[state.enemy.creatureId];

  // build live text for cards that depend on combat state
  function liveTextForCard(card) {
    if (card.kind === 'ORB') {
      const pct = Math.round(window.calcCaptureChance(card.id, state.enemy.hp, state.enemy.maxHp) * 100);
      return { liveText: `${pct}%`, liveSubtitle: 'CAPTURE CHANCE' };
    }
    if (card.kind === 'ATK') {
      const mods = window.calcDamageMods(card.type, playerCreature.type, 'NORMAL');
      let dmg = Math.round(card.dmg * mods.mult);
      const tag = mods.stab > 1 && mods.effectiveness > 1 ? 'STAB · EFFECTIVE'
               : mods.stab > 1 ? 'STAB'
               : mods.effectiveness > 1 ? 'EFFECTIVE'
               : mods.effectiveness < 1 ? 'RESISTED' : null;
      return tag ? { liveText: `${dmg} DMG`, liveSubtitle: tag } : null;
    }
    return null;
  }

  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      color: P.textDark,
      position:'relative', overflow:'hidden',
      imageRendering:'pixelated',
      display:'flex', flexDirection:'column',
    }}>
      {/* ── BATTLE STAGE ── */}
      <BattleBackdrop style={{ flex:'0 0 55%', position:'relative' }}>
        {/* HUD top-left */}
        <div style={{ position:'absolute', top: 10, left: 12,
          display:'flex', flexDirection:'column', gap: 8 }}>
          <div style={{
            background: P.boxBorder, color:'#fff', padding:'4px 10px',
            fontSize: 12, letterSpacing: 1, fontWeight: 700,
            boxShadow:`inset 0 0 0 2px ${P.boxBorderHi}`,
            clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
          }}>TURN {state.turn}</div>
          <div style={{
            background:'rgba(255,255,255,0.85)', padding:'5px 9px',
            display:'flex', alignItems:'center', gap: 6,
            boxShadow:`0 0 0 2px ${P.boxBorder}`,
            clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.textDark }}>NRG</span>
            <div style={{ display:'flex', gap: 4 }}>
              {Array.from({length: state.maxEnergy}).map((_,i) =>
                <EnergyPip key={i} filled={i < state.energy} />
              )}
            </div>
          </div>
        </div>

        {/* HUD top-right: pile counts */}
        <div style={{ position:'absolute', top: 10, right: 12,
          display:'flex', flexDirection:'column', gap: 6, alignItems:'flex-end' }}>
          <div style={{ background:'rgba(255,255,255,0.85)', padding:'4px 8px',
            fontSize: 11, fontWeight: 700, color: P.textDark,
            boxShadow:`0 0 0 2px ${P.boxBorder}`,
            clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
          }}>DRAW {state.drawPile.length}</div>
          <div style={{ background:'rgba(255,255,255,0.85)', padding:'4px 8px',
            fontSize: 11, fontWeight: 700, color: P.textDark,
            boxShadow:`0 0 0 2px ${P.boxBorder}`,
            clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
          }}>DISC {state.discardPile.length}</div>
        </div>

        {/* ENEMY upper-right */}
        <div style={{ position:'absolute', top: 60, right: 60,
          display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{
            transform: animEnemy ? 'translateX(8px)' : 'translateX(0)',
            transition:'transform 60ms steps(2)',
            position:'relative',
          }}>
            <CreatureSprite creature={enemyCreature} scale={7} />
            {floaty?.who === 'enemy' && (
              <div key={floaty.key} style={{
                position:'absolute', top: -8, left:'50%',
                color: floaty.color || '#e84050',
                fontSize: 22, fontWeight: 900,
                textShadow:'2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                animation:'pokeFloaty 850ms forwards',
              }}>{floaty.text}</div>
            )}
          </div>
          <Platform width={150} />
        </div>

        {/* enemy nameplate */}
        <div style={{ position:'absolute', top: 56, left: 130 }}>
          <NamePlate creature={enemyCreature} hp={state.enemy.hp} maxHp={state.enemy.maxHp}
            level={5} statuses={state.enemy.statuses} block={state.enemy.block} isFoe />
          <div style={{ marginTop: 4, display:'flex', justifyContent:'flex-end' }}>
            <IntentBadge intent={state.enemy.intent} />
          </div>
        </div>

        {/* mod popup (STAB / SUPER EFFECTIVE) — center stage */}
        {modBadge && (
          <div key={modBadge.key} style={{
            position:'absolute', top:'34%', left:'50%',
            transform:'translateX(-50%)',
            animation:'pokeModFloat 1100ms steps(6) forwards',
            zIndex: 5,
          }}>
            <DamageModBadge stab={modBadge.stab} effectiveness={modBadge.effectiveness} />
          </div>
        )}

        {/* PLAYER lower-left */}
        <div style={{ position:'absolute', bottom: 100, left: 50,
          display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{
            transform: animPlayer
              ? 'translateX(-8px)'
              : switchAnim ? 'translateY(20px)' : 'translateX(0)',
            opacity: switchAnim ? 0 : 1,
            transition:'transform 60ms steps(2), opacity 180ms steps(3)',
            position:'relative',
          }}>
            <CreatureSprite creature={playerCreature} scale={7} flipX />
            {floaty?.who === 'player' && (
              <div key={floaty.key} style={{
                position:'absolute', top: -8, left:'50%',
                color: floaty.color || '#e84050',
                fontSize: 22, fontWeight: 900,
                textShadow:'2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                animation:'pokeFloaty 850ms forwards',
              }}>{floaty.text}</div>
            )}
          </div>
          <Platform width={150} />
        </div>

        {/* player nameplate */}
        <div style={{ position:'absolute', bottom: 110, right: 50 }}>
          <NamePlate creature={playerCreature} hp={active.hp} maxHp={active.maxHp}
            level={5} statuses={active.statuses} block={active.block} />
        </div>

        {/* ── PARTY BAR (6 slots) ── */}
        <div style={{
          position:'absolute', left: 0, right: 0, bottom: 0,
          background:'rgba(40,48,88,0.92)',
          boxShadow:`inset 0 3px 0 0 #fcd848, inset 0 5px 0 0 ${P.boxBorder}`,
          padding:'10px 14px',
          display:'flex', alignItems:'center', gap: 10,
        }}>
          <div style={{
            color:'#fcd848', fontSize: 11, fontWeight: 800, letterSpacing: 1,
            writingMode:'vertical-rl', transform:'rotate(180deg)',
            lineHeight: 1,
          }}>PARTY</div>
          {state.team.map((m, i) =>
            <TeamSlot key={i} member={m}
              active={i === state.activeIdx}
              fainted={m.hp <= 0}
              canSwitch={state.energy >= SWITCH_COST && !state.over}
              onClick={() => doSwitch(i)} />
          )}
          <div style={{ marginLeft:'auto',
            color:'#fff', fontSize: 10, fontWeight: 600, opacity: 0.8,
            textAlign:'right', lineHeight: 1.3,
          }}>
            click a creature<br/>to SWITCH ({SWITCH_COST}<span style={{color:'#fcd848'}}>★</span>)
          </div>
        </div>
      </BattleBackdrop>

      {/* ── HAND ── */}
      <div style={{
        flex: 1,
        background:`linear-gradient(${P.boxBorder} 0%, #1a2040 100%)`,
        boxShadow:`inset 0 4px 0 0 ${P.boxBorderLo}, inset 0 6px 0 0 ${P.boxBorderHi}`,
        position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center',
        gap: 6, padding:'14px 220px 14px 16px',
      }}>
        {state.hand.map((cardId, i) => {
          const c = window.CARDS_BY_ID[cardId];
          const canPlay = c && c.cost <= state.energy && !state.over;
          const live = liveTextForCard(c) || {};
          return (
            <div key={i} style={{
              transform: `rotate(${(i - (state.hand.length-1)/2) * 2}deg)`,
            }}>
              <PixCard card={c}
                onClick={() => playCard(i)}
                disabled={!canPlay}
                dimmed={!canPlay}
                scale={0.86}
                liveText={live.liveText}
                liveSubtitle={live.liveSubtitle}
              />
            </div>
          );
        })}
        {state.hand.length === 0 && (
          <div style={{ color:'#fff', fontSize: 14, fontWeight: 700 }}>— hand empty —</div>
        )}

        <div style={{
          position:'absolute', right: 16, top:'50%',
          transform:'translateY(-50%)',
          display:'flex', flexDirection:'column', gap: 8,
        }}>
          <PixButton onClick={endTurn} disabled={!!state.over} tone="red">END TURN</PixButton>
          <PixButton onClick={reset} small tone="white">RESET</PixButton>
        </div>

        <div style={{
          position:'absolute', left: 16, bottom: 4,
          fontSize: 11, color:'#cbd4f0', fontWeight: 500,
          maxWidth: 360, lineHeight: 1.3,
        }}>
          {state.log.slice(-2).map((l, i) => <div key={i}>› {l}</div>)}
        </div>
      </div>

      {/* ── GAME OVER ── */}
      {state.over && (
        <div style={{
          position:'absolute', inset: 0,
          background:'rgba(20, 24, 48, 0.78)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            background: P.boxBg, padding: 24,
            boxShadow:`inset 0 0 0 2px ${P.boxBorderHi}, inset 0 0 0 5px ${P.boxBorder}`,
            clipPath:'polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)',
            textAlign:'center', minWidth: 280,
          }}>
            <div style={{
              fontSize: 22, marginBottom: 14, fontWeight: 900, letterSpacing: 2,
              color: state.over === 'win-capture' ? '#d96aa8' :
                     state.over === 'win-defeat'  ? '#48b048' : '#d04848',
            }}>
              {state.over === 'win-capture' ? 'CAPTURED!' :
               state.over === 'win-defeat'  ? 'VICTORY!' : 'DEFEAT…'}
            </div>
            {state.over === 'win-capture' && (
              <div style={{ marginBottom: 12, display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
                <CreatureSprite creature={enemyCreature} scale={5} />
                <div style={{ fontSize: 13, color: P.textDark, fontWeight: 700 }}>
                  {enemyCreature.name} was registered.
                </div>
              </div>
            )}
            <PixButton onClick={reset} tone="blue">NEW BATTLE</PixButton>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pokeFloaty {
          from { transform: translate(-50%, 0); opacity: 1; }
          to   { transform: translate(-50%, -34px); opacity: 0; }
        }
        @keyframes pokeModFloat {
          0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
          30%  { transform: translateX(-50%) scale(1.1); opacity: 1; }
          70%  { transform: translateX(-50%) scale(1.0); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

window.CombatScene = CombatScene;
})();
