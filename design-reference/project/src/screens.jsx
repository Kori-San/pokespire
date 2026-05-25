// Pokespire — static screens (GBA era)
(function () {
var { useState, useEffect } = React;
var {
  PixSprite, CreatureSprite, PixBox, PixButton, NamePlate,
  PixCard, EnergyPip, BattleBackdrop, Platform, StatusChip,
} = window;
var P = window.PAL;

// Tiny helper for the white-with-blue-tube panel
function PokeBox({ children, style, padding = 12 }) {
  return (
    <div style={{
      position:'relative',
      background: P.boxBg,
      padding,
      boxShadow: `inset 0 0 0 2px ${P.boxBorderHi}, inset 0 0 0 5px ${P.boxBorder}`,
      clipPath:'polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)',
      fontFamily:'"Pixelify Sans", monospace',
      color: P.textDark,
      ...style,
    }}>{children}</div>
  );
}

// ─── TITLE ────────────────────────────────────────────────────
function TitleScreen({ width = 480, height = 560 }) {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      position:'relative', overflow:'hidden',
      background: `linear-gradient(180deg, #234487 0%, #4366b8 30%, #f08858 65%, #f5b878 100%)`,
    }}>
      {/* stars */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'40%' }}>
        {Array.from({length: 22}).map((_,i) => {
          const x = (i * 53) % 480;
          const y = (i * 31) % 200;
          return <rect key={i} x={x} y={y} width="2" height="2" fill="#fff8c8" opacity="0.7"/>;
        })}
      </svg>

      {/* horizon glow */}
      <div style={{
        position:'absolute', left:0, right:0, top:'48%', height: 80,
        background:'radial-gradient(ellipse at center top, #fce7a8 0%, transparent 70%)',
      }}/>

      {/* sun disc */}
      <div style={{
        position:'absolute', left:'50%', top:'42%',
        width: 110, height: 110, marginLeft:-55,
        borderRadius:'50%',
        background:'radial-gradient(circle, #fce7a8 0%, #f8b878 50%, transparent 70%)',
      }}/>

      {/* far hills (silhouette) */}
      <div style={{
        position:'absolute', left:0, right:0, top:'58%', height: 18,
        background:'#7a3a48', opacity:0.85,
        clipPath:'polygon(0 100%, 8% 60%, 16% 80%, 28% 40%, 42% 70%, 56% 30%, 70% 65%, 82% 45%, 100% 80%, 100% 100%)',
      }}/>

      {/* logo */}
      <div style={{
        position:'absolute', top: 50, left: 0, right: 0,
        textAlign:'center', zIndex: 2,
      }}>
        <div style={{
          fontFamily:'"Press Start 2P", monospace',
          fontSize: 38, lineHeight: 1.1, letterSpacing: 3,
          color:'#fcd848',
          textShadow:'3px 3px 0 #783818, 6px 6px 0 #4a1808',
        }}>POKE<br/>SPIRE</div>
        <div style={{
          marginTop: 14, fontSize: 13, color:'#fff', letterSpacing: 2,
          textShadow:'1px 1px 0 #283058',
        }}>A DECK · A CREATURE · A SPIRE</div>
      </div>

      {/* creature row standing on grass */}
      <div style={{
        position:'absolute', bottom: 110, left: 0, right: 0,
        display:'flex', justifyContent:'center', alignItems:'flex-end',
        gap: 14, zIndex: 2,
      }}>
        {['emberling','brookpup','sproutkin','voltail'].map(id =>
          <div key={id} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <CreatureSprite creature={window.CREATURES[id]} scale={3} />
            <Platform width={56} />
          </div>
        )}
      </div>

      {/* grass strip */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, height: 96,
        background:`linear-gradient(${P.grassLight} 0%, ${P.grass} 50%, ${P.grassDark} 100%)`,
      }}/>

      {/* menu box */}
      <PokeBox style={{
        position:'absolute', bottom: 12, left: 12, right: 12,
        zIndex: 3, padding: '10px 14px',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 1,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{
            opacity: blink ? 1 : 0.3, transition:'opacity 80ms',
          }}>▷ PRESS START</span>
          <span style={{ fontSize: 10, color: P.textMid }}>©MMXXVI LAYAN STUDIOS</span>
        </div>
      </PokeBox>
    </div>
  );
}

// ─── STARTER SELECT ───────────────────────────────────────────
function StarterSelect({ width = 760, height = 560 }) {
  const captured = ['emberling','brookpup','sproutkin','voltail','dreamoth','shadepaw'];
  const [pick, setPick] = useState('emberling');
  const c = window.CREATURES[pick];
  const t = window.TYPES[c.type];

  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      background:`linear-gradient(${P.skyTop} 0%, ${P.skyBot} 100%)`,
      position:'relative', overflow:'hidden', padding: 16,
      display:'flex', flexDirection:'column', gap: 12,
    }}>
      {/* header */}
      <PokeBox style={{ padding:'8px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
            CHOOSE YOUR PARTNER
          </span>
          <span style={{ fontSize: 11, color: P.textMid }}>RUN 014 · DAY 1</span>
        </div>
      </PokeBox>

      <div style={{ display:'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* roster grid */}
        <PokeBox style={{ flex: 1, padding: 12 }}>
          <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 700, color: P.textMid }}>
            CAPTURED ROSTER · 6 of 24
          </div>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8,
          }}>
            {captured.map(id => {
              const cr = window.CREATURES[id];
              const ct = window.TYPES[cr.type];
              const sel = id === pick;
              return (
                <div key={id} onClick={() => setPick(id)} style={{
                  cursor:'pointer',
                  background: sel ? ct.light : P.boxBgAlt,
                  boxShadow: sel
                    ? `inset 0 0 0 3px ${ct.dark}, 0 0 0 1px ${P.boxBorder}`
                    : `0 0 0 1px ${P.boxBorder}`,
                  padding: 8,
                  display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
                }}>
                  <CreatureSprite creature={cr} scale={3} />
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{cr.name}</div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color:'#fff',
                    background: ct.primary,
                    padding:'1px 5px',
                  }}>{ct.name}</div>
                  <div style={{ fontSize: 10, color: P.textMid }}>{cr.dex}</div>
                </div>
              );
            })}
          </div>
        </PokeBox>

        {/* detail */}
        <div style={{ width: 260, display:'flex', flexDirection:'column', gap: 10 }}>
          <PokeBox style={{ flex: 1, display:'flex', flexDirection:'column',
            alignItems:'center', padding: 14, gap: 8 }}>
            <div style={{
              background: t.primary, color:'#fff',
              padding:'2px 10px', fontSize: 11, fontWeight: 700,
              alignSelf:'flex-start',
              boxShadow:`inset 0 -2px 0 0 ${t.dark}`,
            }}>{c.dex} · {t.name}</div>
            <CreatureSprite creature={c} scale={7} />
            <Platform width={120} />
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>{c.name}</div>
            <NamePlate creature={c} hp={c.hp} maxHp={c.hp} level={5} />
            <div style={{
              fontSize: 12, lineHeight: 1.4, textAlign:'center',
              color: P.textDark, padding:'4px 8px',
            }}>{c.blurb}</div>
          </PokeBox>
          <PixButton tone="red">BEGIN RUN ▷</PixButton>
        </div>
      </div>
    </div>
  );
}

// ─── SPIRE MAP ────────────────────────────────────────────────
function MapScreen({ width = 560, height = 720 }) {
  const nodes = [
    { id:'s',  x:2, y:0, type:'start', to:['a1','a2'] },
    { id:'a1', x:1, y:1, type:'fight', to:['b1','b2'] },
    { id:'a2', x:3, y:1, type:'fight', to:['b2','b3'] },
    { id:'b1', x:0, y:2, type:'event', to:['c1'] },
    { id:'b2', x:2, y:2, type:'shop',  to:['c1','c2'] },
    { id:'b3', x:4, y:2, type:'fight', to:['c2','c3'] },
    { id:'c1', x:1, y:3, type:'fight', to:['d1'] },
    { id:'c2', x:3, y:3, type:'rest',  to:['d1','d2'] },
    { id:'c3', x:4, y:3, type:'fight', to:['d2'] },
    { id:'d1', x:2, y:4, type:'elite', to:['e1'] },
    { id:'d2', x:4, y:4, type:'event', to:['e1'] },
    { id:'e1', x:2, y:5, type:'boss',  to:[] },
  ];
  const visited = new Set(['s','a1']);
  const current = 'a1';
  const reachable = new Set(['b1','b2']);

  const colW = 100, rowH = 90;
  const offsetX = 30, offsetY = 24;
  const xy = n => ({ x: offsetX + n.x * colW + 24, y: offsetY + (5 - n.y) * rowH + 24 });

  const nodeStyles = {
    start: { glyph:'★', bg:'#48b048', border:'#185018' },
    fight: { glyph:'⚔', bg:'#d04848', border:'#601818' },
    elite: { glyph:'✦', bg:'#a050c8', border:'#502878' },
    boss:  { glyph:'☠', bg:'#282838', border:'#0c0c18' },
    event: { glyph:'?', bg:'#f8c020', border:'#783818' },
    shop:  { glyph:'$', bg:'#48a8d8', border:'#185878' },
    rest:  { glyph:'♥', bg:'#f078a8', border:'#7c2858' },
  };

  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      background:`linear-gradient(${P.skyTop}, ${P.skyBot} 60%, ${P.grass} 100%)`,
      position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column',
    }}>
      {/* header */}
      <PokeBox style={{ margin: 12, padding:'8px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>◀ SPIRE MAP</span>
          <span style={{ fontSize: 11, color: P.textMid }}>FLOOR 4 / 12</span>
        </div>
      </PokeBox>

      {/* map canvas */}
      <div style={{ flex: 1, position:'relative', margin:'0 12px' }}>
        {/* faint cloud bands */}
        <div style={{
          position:'absolute', inset: 0,
          backgroundImage:`radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize:'18px 18px',
        }}/>

        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
          {nodes.flatMap(n => n.to.map(toId => {
            const t = nodes.find(x => x.id === toId);
            const a = xy(n), b = xy(t);
            const passed = visited.has(n.id) && visited.has(toId);
            return (
              <line key={n.id+toId}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={passed ? '#f8c020' : P.boxBorder}
                strokeWidth="3"
                strokeDasharray={passed ? '0' : '4 4'}
                strokeLinecap="square"
              />
            );
          }))}
        </svg>

        {nodes.map(n => {
          const p = xy(n);
          const ns = nodeStyles[n.type];
          const isCur = n.id === current;
          const isReach = reachable.has(n.id);
          const isBoss = n.type === 'boss';
          const size = isBoss ? 56 : 42;
          return (
            <div key={n.id} style={{
              position:'absolute',
              left: p.x - size/2, top: p.y - size/2,
              width: size, height: size,
              background: ns.bg, color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:
                `inset 0 0 0 2px rgba(255,255,255,0.3),` +
                `0 0 0 2px ${ns.border}` +
                (isReach && !isCur ? `, 0 0 0 5px #fff, 0 0 0 7px ${ns.border}` : '') +
                (isCur ? `, 0 0 0 5px #fcd848, 0 0 0 7px ${ns.border}` : ''),
              fontSize: isBoss ? 24 : 18, fontWeight: 800,
              clipPath:'polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)',
              animation: isReach && !isCur ? 'pokePulse 700ms steps(2) infinite' : 'none',
            }}>{ns.glyph}</div>
          );
        })}
      </div>

      {/* legend */}
      <PokeBox style={{ margin:'0 12px', padding:'6px 10px' }}>
        <div style={{
          display:'flex', gap: 10, flexWrap:'wrap',
          fontSize: 11, fontWeight: 700, color: P.textDark,
        }}>
          <span><span style={{color:'#d04848'}}>⚔</span> FIGHT</span>
          <span><span style={{color:'#a050c8'}}>✦</span> ELITE</span>
          <span><span style={{color:'#f8c020'}}>?</span> EVENT</span>
          <span><span style={{color:'#48a8d8'}}>$</span> SHOP</span>
          <span><span style={{color:'#f078a8'}}>♥</span> REST</span>
          <span><span style={{color:'#282838'}}>☠</span> BOSS</span>
        </div>
      </PokeBox>

      {/* party dock */}
      <PokeBox style={{ margin: 12, padding:'8px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <CreatureSprite creature={window.CREATURES.emberling} scale={3} />
          <div style={{ flex: 1 }}>
            <NamePlate creature={window.CREATURES.emberling} hp={22} maxHp={28} level={7} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textAlign:'right', color: P.textDark }}>
            DECK 14<br/>GOLD 47
          </div>
        </div>
      </PokeBox>

      <style>{`
        @keyframes pokePulse {
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ─── CARD REWARD ──────────────────────────────────────────────
function RewardScreen({ width = 680, height = 560 }) {
  const choices = ['cinderlash','tidalcrash','staticpulse'].map(id => window.CARDS_BY_ID[id]);
  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      background:`linear-gradient(${P.skyTop}, ${P.skyBot} 50%, ${P.grass} 100%)`,
      position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column', padding: 16, gap: 14,
    }}>
      {/* victory banner */}
      <PokeBox style={{ padding:'10px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{
            fontSize: 18, fontWeight: 900, color:'#d04848',
            letterSpacing: 2,
          }}>★ VICTORY ★</span>
          <span style={{ fontSize: 11, color: P.textMid }}>+12 GOLD · +1 ESSENCE</span>
        </div>
      </PokeBox>

      <PokeBox style={{ padding:'8px 14px', textAlign:'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          CHOOSE A CARD TO ADD TO YOUR DECK
        </span>
      </PokeBox>

      <div style={{
        flex: 1, display:'flex', justifyContent:'center', alignItems:'center',
        gap: 28,
      }}>
        {choices.map((c, i) => (
          <div key={i} style={{
            transform: `translateY(${i === 1 ? -10 : 0}px) rotate(${(i-1) * 2}deg)`,
          }}>
            <PixCard card={c} scale={1.1} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'center', gap: 10 }}>
        <PixButton tone="red">TAKE CARD</PixButton>
        <PixButton small tone="white">SKIP</PixButton>
      </div>
    </div>
  );
}

// ─── DEX ──────────────────────────────────────────────────────
function DexScreen({ width = 760, height = 560 }) {
  const captured = ['emberling','brookpup','sproutkin','voltail','dreamoth','shadepaw','cindermaw','brinescale'];
  const total = 24;
  const [sel, setSel] = useState('emberling');
  const c = window.CREATURES[sel];
  const t = window.TYPES[c.type];

  const slots = [];
  for (let i = 0; i < total; i++) slots.push(captured[i] || null);

  return (
    <div style={{
      width, height,
      fontFamily:'"Pixelify Sans", monospace',
      background:`linear-gradient(${P.skyTop}, ${P.skyBot} 100%)`,
      position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column', padding: 14, gap: 12,
    }}>
      <PokeBox style={{ padding:'8px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>◇ POKEDEX ◇</span>
          <span style={{ fontSize: 11, color: P.textMid }}>
            {captured.length} of {total} REGISTERED
          </span>
        </div>
      </PokeBox>

      <div style={{ flex: 1, display:'flex', gap: 14, minHeight: 0 }}>
        <PokeBox style={{
          flex: 1, padding: 10,
          overflow:'auto',
        }}>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 8,
            alignContent:'start',
          }}>
            {slots.map((id, i) => {
              if (id) {
                const cr = window.CREATURES[id];
                const ct = window.TYPES[cr.type];
                const isSel = id === sel;
                return (
                  <div key={i} onClick={() => setSel(id)} style={{
                    cursor:'pointer',
                    background: isSel ? ct.light : P.boxBgAlt,
                    boxShadow: isSel
                      ? `inset 0 0 0 2px ${ct.primary}, 0 0 0 2px ${ct.dark}`
                      : `0 0 0 1px ${P.boxBorder}`,
                    padding: 4, aspectRatio:'1 / 1',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap: 2,
                  }}>
                    <CreatureSprite creature={cr} scale={2} />
                    <div style={{ fontSize: 8, fontWeight: 700, color: P.textDark }}>
                      {cr.dex}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} style={{
                  background:'#283050', boxShadow:`0 0 0 1px ${P.boxBorder}`,
                  aspectRatio:'1 / 1',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#5878a8', fontSize: 22, fontWeight: 900,
                }}>?</div>
              );
            })}
          </div>
        </PokeBox>

        {/* detail */}
        <PokeBox style={{
          width: 240, padding: 14,
          display:'flex', flexDirection:'column', gap: 8, alignItems:'center',
        }}>
          <div style={{
            alignSelf:'flex-start',
            background: t.primary, color:'#fff',
            padding:'2px 10px', fontSize: 11, fontWeight: 700,
            boxShadow:`inset 0 -2px 0 0 ${t.dark}`,
          }}>{c.dex} · {t.name}</div>
          <CreatureSprite creature={c} scale={6} />
          <Platform width={110} />
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 1 }}>{c.name}</div>
          <NamePlate creature={c} hp={c.hp} maxHp={c.hp} level={5} />
          <div style={{
            fontSize: 12, lineHeight: 1.4, textAlign:'center', color: P.textDark,
            padding:'4px 6px',
          }}>{c.blurb}</div>
          <div style={{ marginTop:'auto', alignSelf:'stretch' }}>
            <PixButton small tone="blue" style={{ width:'100%' }}>SET AS STARTER</PixButton>
          </div>
        </PokeBox>
      </div>
    </div>
  );
}

Object.assign(window, { TitleScreen, StarterSelect, MapScreen, RewardScreen, DexScreen });
})();
