// Pokespire — GBA-era pixel UI primitives.
// White textboxes with the classic blue rounded "tube" border, colorful HP bars, type-tinted cards.
(function () {
var { useState, useEffect, useRef } = React;
var P = window.PAL;

// ─── Sprite renderer (pixel grid → box-shadow) ────────────────
// Reads palette from the creature object if not passed explicitly.
function PixSprite({ rows, scale = 6, palette, style, flipX = false }) {
  if (!rows) return null;
  const shadows = [];
  const w = rows[0].length;
  const h = rows.length;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const idx = ch === '.' ? 0 : parseInt(ch, 10);
      const color = palette[idx];
      if (!color) continue;
      shadows.push(`${x * scale}px ${y * scale}px 0 0 ${color}`);
    }
  }
  return (
    <div style={{
      position:'relative',
      width: w * scale, height: h * scale,
      imageRendering:'pixelated',
      transform: flipX ? 'scaleX(-1)' : 'none',
      ...style,
    }}>
      <div style={{
        position:'absolute',
        width: scale, height: scale,
        boxShadow: shadows.join(','),
      }} />
    </div>
  );
}

// ─── CreatureSprite: convenience wrapper that reads palette ────
function CreatureSprite({ creature, scale = 6, flipX, style }) {
  if (!creature) return null;
  return <PixSprite rows={creature.sprite} palette={creature.palette}
    scale={scale} flipX={flipX} style={style} />;
}

// ─── Classic GBA-style white textbox ──────────────────────────
// Two-tone blue rounded border: outer dark, inner light highlight.
// "Rounded" effect achieved by cutting corner pixels.
function PixBox({ children, style, padding = 14, bg, borderDark, borderHi, corner = 4 }) {
  const _bg = bg || P.boxBg;
  const _d = borderDark || P.boxBorder;
  const _h = borderHi || P.boxBorderHi;
  return (
    <div style={{
      position:'relative',
      background: _bg,
      padding,
      // outer dark border (3px) + inner highlight (2px) via stacked insets
      boxShadow:
        `inset 0 0 0 2px ${_h},` +
        `inset 0 0 0 5px ${_d}`,
      ...style,
    }}>
      {/* corner cut-off pixels for the "rounded" look */}
      {[[true,true],[false,true],[true,false],[false,false]].map(([l,t], i) => (
        <span key={i} style={{
          position:'absolute',
          width: corner, height: corner,
          background: 'transparent',
          // remove a corner block by overlaying with parent's true background
          // (caller may supply a wrapper bg; we use box-shadow to fake it)
          boxShadow:
            `inset 0 0 0 ${corner}px ${_d}`,
          // Actually we want to ERASE the corner. Use a mask via clipping:
          ...(l ? {left:-2} : {right:-2}),
          ...(t ? {top:-2} : {bottom:-2}),
          display:'none', // disabled, doesn't render properly with shadows
        }} />
      ))}
      {children}
    </div>
  );
}

// ─── GBA nameplate (creature name + lv + HP bar) ──────────────
function NamePlate({ creature, hp, maxHp, level = 5, statuses = {}, block = 0, isFoe = false }) {
  const ratio = Math.max(0, hp / maxHp);
  const fillColor = ratio > 0.5 ? P.hpHigh : ratio > 0.2 ? P.hpMid : P.hpLow;
  return (
    <div style={{
      position:'relative',
      width: 230,
      background: P.boxBg,
      // The classic two-tone "tube" border
      boxShadow:
        `inset 0 0 0 2px ${P.boxBorderHi},` +
        `inset 0 0 0 4px ${P.boxBorder}`,
      padding: '8px 12px',
      fontFamily: '"Pixelify Sans", monospace',
      color: P.textDark,
      // Cut the corners using clip-path so the rounded-rect feel comes through.
      clipPath:
        'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <span style={{ fontSize: 15, letterSpacing: 1, fontWeight: 700 }}>
          {creature.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>:L{level}</span>
      </div>
      {/* HP row */}
      <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 4 }}>
        <span style={{
          fontSize: 9, letterSpacing: 1,
          background: '#fac070', color: '#783820',
          padding:'1px 5px', fontWeight: 700,
        }}>HP</span>
        <div style={{
          position:'relative', flex: 1, height: 6,
          background: P.hpBg,
          boxShadow: `0 0 0 1px ${P.boxBorder}`,
        }}>
          <div style={{
            position:'absolute', left: 0, top: 0, bottom: 0,
            width: `${ratio * 100}%`,
            background: fillColor,
            transition: 'width 220ms steps(8)',
          }}/>
          <div style={{
            position:'absolute', left: 0, top: 1, height: 1,
            width: `${ratio * 100}%`,
            background: 'rgba(255,255,255,0.45)',
          }}/>
        </div>
      </div>
      {!isFoe && (
        <div style={{
          fontSize: 11, textAlign:'right', marginTop: 2,
          color: P.textDark, fontWeight: 600,
        }}>{hp}/{maxHp}</div>
      )}
      {/* status row */}
      {(block > 0 || Object.keys(statuses).length > 0) && (
        <div style={{ display:'flex', gap: 4, marginTop: 4, flexWrap:'wrap' }}>
          {block > 0 && <StatusChip label="BLK" count={block} bg="#8898c8" />}
          {Object.entries(statuses).map(([k,v]) =>
            <StatusChip key={k} label={k.slice(0,4).toUpperCase()} count={v}
              bg={k === 'burn' ? '#e85040' : k === 'weak' ? '#a07cc0' : '#888'} />
          )}
        </div>
      )}
    </div>
  );
}

function StatusChip({ label, count, bg }) {
  return (
    <span style={{
      display:'inline-block',
      background: bg || '#888',
      color:'#fff',
      fontSize: 9, padding:'1px 5px',
      letterSpacing: 1, fontWeight: 700,
      fontFamily:'"Pixelify Sans", monospace',
    }}>{label}×{count}</span>
  );
}

// ─── Pixel button (chunky GBA-style, blue-tube border) ────────
function PixButton({ children, onClick, disabled, style, small, tone = 'blue' }) {
  const [hover, setHover] = useState(false);
  const tones = {
    blue:   { bg:'#5878c8', bgHi:'#a8b8e8', border:'#283058', text:'#ffffff' },
    red:    { bg:'#d04848', bgHi:'#f0a8a8', border:'#601818', text:'#ffffff' },
    green:  { bg:'#48b048', bgHi:'#a8e0a8', border:'#185018', text:'#ffffff' },
    white:  { bg:'#f8f8f8', bgHi:'#ffffff', border:'#283058', text:'#283058' },
    yellow: { bg:'#f8c020', bgHi:'#fce478', border:'#783818', text:'#382800' },
  };
  const t = tones[tone] || tones.blue;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:'relative',
        fontFamily:'"Pixelify Sans", monospace',
        fontSize: small ? 13 : 16,
        fontWeight: 700,
        letterSpacing: 1,
        padding: small ? '6px 14px' : '10px 20px',
        background: hover && !disabled ? t.bgHi : t.bg,
        color: t.text,
        border:'none',
        boxShadow:
          `inset 0 0 0 1px rgba(255,255,255,0.4),` +
          `inset 0 -3px 0 0 ${t.border},` +
          `0 0 0 2px ${t.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        textTransform:'uppercase',
        imageRendering:'pixelated',
        clipPath:
          'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
        ...style,
      }}>{children}</button>
  );
}

// ─── PixCard — type-tinted ability card ──────────────────────
function PixCard({ card, onClick, disabled, selected, scale = 1, dimmed, liveText, liveSubtitle }) {
  if (!card) return null;
  const w = 116 * scale, h = 162 * scale;
  const t = window.TYPES[card.type] || window.TYPES.NORMAL;
  const [hover, setHover] = useState(false);
  const isHover = hover && !disabled;
  const lift = (selected ? 8 : 0) + (isHover ? 14 : 0);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: w, height: h,
        position:'relative',
        background: P.boxBg,
        boxShadow:
          `inset 0 0 0 2px ${t.light},` +
          `inset 0 0 0 4px ${t.dark},` +
          (isHover
            ? `0 0 0 3px #fcd848, 0 0 0 5px ${t.dark}, 0 ${8*scale}px 0 0 rgba(0,0,0,0.35)`
            : `0 ${4*scale}px 0 0 rgba(0,0,0,0.25)`),
        color: P.textDark,
        fontFamily:'"Pixelify Sans", monospace',
        padding: 6 * scale,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: dimmed ? 0.5 : 1,
        userSelect:'none',
        flexShrink:0,
        display:'flex', flexDirection:'column',
        transform: `translateY(-${lift}px)` + (isHover ? ' scale(1.04)' : ''),
        transformOrigin: 'center bottom',
        transition:'transform 100ms steps(3), box-shadow 60ms steps(2)',
        zIndex: isHover ? 10 : 1,
        clipPath:
          'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
      }}
    >
      {/* cost orb */}
      <div style={{
        position:'absolute', top: -4*scale, left: -4*scale,
        width: 26*scale, height: 26*scale,
        background: '#f8c020',
        color: '#382800',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: 16*scale, fontWeight: 800,
        boxShadow:
          `inset 0 0 0 1px #fce478,` +
          `inset 0 0 0 3px #8c5c10,` +
          `0 0 0 2px #f8f8f8`,
        clipPath: 'circle(50%)',
        zIndex: 2,
      }}>{card.cost}</div>

      {/* name strip — type colored */}
      <div style={{
        background: t.primary, color: '#fff',
        textAlign:'center',
        padding: `${4*scale}px 0`,
        marginBottom: 4*scale,
        fontSize: 11*scale,
        fontWeight: 800,
        letterSpacing: 1,
        textShadow: `1px 1px 0 ${t.dark}`,
        boxShadow: `inset 0 -2px 0 0 ${t.dark}`,
      }}>{card.name}</div>

      {/* art window */}
      <div style={{
        background: t.light,
        flex: 1,
        boxShadow: `inset 0 0 0 2px ${t.dark}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative',
        minHeight: 56 * scale,
      }}>
        <div style={{
          fontSize: 36 * scale, color: t.dark, lineHeight: 1,
          textShadow: `2px 2px 0 ${P.boxBg}`,
        }}>{t.glyph}</div>
        <div style={{
          position:'absolute', bottom: 0, right: 0,
          fontSize: 9*scale, background: t.dark, color:'#fff',
          padding:'1px 4px', fontWeight: 700,
        }}>{card.kind}</div>
      </div>

      {/* body text */}
      <div style={{
        marginTop: 4*scale,
        fontSize: 11*scale,
        lineHeight: 1.25,
        whiteSpace:'pre-wrap',
        minHeight: 36*scale,
        textAlign:'center',
        color: P.textDark,
        fontWeight: 500,
      }}>
        {liveText ? (
          <div>
            <div style={{
              fontSize: 18*scale, fontWeight: 900, color: t.dark,
              letterSpacing: 1, marginBottom: 2,
            }}>{liveText}</div>
            {liveSubtitle && (
              <div style={{ fontSize: 9*scale, color: P.textMid }}>{liveSubtitle}</div>
            )}
          </div>
        ) : card.text}
      </div>
    </div>
  );
}

// ─── Energy pip ──────────────────────────────────────────────
function EnergyPip({ filled }) {
  return (
    <div style={{
      width: 18, height: 18,
      background: filled ? '#f8c020' : '#383850',
      boxShadow:
        `inset 0 0 0 1px ${filled ? '#fce478' : '#5c5c70'},` +
        `inset 0 0 0 3px ${filled ? '#8c5c10' : '#181828'},` +
        `0 0 0 2px #f8f8f8`,
      clipPath:'circle(50%)',
    }} />
  );
}

// ─── Battle backdrop (sky + grass + platforms) ───────────────
function BattleBackdrop({ children, style }) {
  return (
    <div style={{
      position:'relative',
      background: `linear-gradient(${P.skyTop} 0%, ${P.skyBot} 50%, ${P.skyHorizon} 50%, ${P.skyHorizon} 56%, ${P.grassLight} 56%, ${P.grass} 100%)`,
      overflow:'hidden',
      ...style,
    }}>
      {/* horizon grass texture */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, height:'44%',
        backgroundImage:
          `repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.05) 6px 7px),
           repeating-linear-gradient(0deg, transparent 0 8px, rgba(0,0,0,0.04) 8px 9px)`,
        pointerEvents:'none',
      }}/>
      {/* far hills silhouette */}
      <div style={{
        position:'absolute', left:0, right:0, top:'46%', height: 10,
        background: P.grassDark, opacity: 0.5,
      }}/>
      {children}
    </div>
  );
}

// ─── Platform under a creature (oval shadow) ──────────────────
function Platform({ width = 140, color = P.platform, dark = P.platformDk }) {
  return (
    <div style={{
      width, height: width * 0.35,
      background: `radial-gradient(ellipse at center, ${color} 60%, ${dark} 70%, transparent 72%)`,
      filter: 'contrast(1.1)',
    }}/>
  );
}

// ─── Intent badge (red attack, blue defend, etc.) ─────────────
function IntentBadge({ intent }) {
  const map = {
    attack: { bg:'#d04848', border:'#601818', label:`⚔ ${intent.value || ''}`, text:'#fff' },
    defend: { bg:'#5878c8', border:'#283058', label:'⛨ DEF', text:'#fff' },
    buff:   { bg:'#9c54c8', border:'#502878', label:'↑ BUFF', text:'#fff' },
  };
  const t = map[intent.type] || map.attack;
  return (
    <div style={{
      background: t.bg, color: t.text,
      padding:'4px 8px',
      fontSize: 11, fontWeight: 800, letterSpacing: 1,
      fontFamily:'"Pixelify Sans", monospace',
      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.4), 0 0 0 2px ${t.border}`,
      clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
    }}>{t.label}</div>
  );
}

// ─── Team slot (mini party portrait for switch bar) ───────────
function TeamSlot({ member, active, fainted, canSwitch, onClick }) {
  const cr = window.CREATURES[member.creatureId];
  const t = window.TYPES[cr.type];
  const ratio = member.hp / member.maxHp;
  const fill = ratio > 0.5 ? P.hpHigh : ratio > 0.2 ? P.hpMid : P.hpLow;
  return (
    <div onClick={fainted || active || !canSwitch ? undefined : onClick}
      style={{
        position:'relative',
        width: 78, padding: 4,
        background: active ? '#fcd848' : fainted ? '#583050' : 'rgba(255,255,255,0.92)',
        boxShadow:
          `inset 0 0 0 1px rgba(255,255,255,0.4),` +
          `0 0 0 2px ${active ? '#8c5c10' : P.boxBorder}`,
        clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
        cursor: !active && !fainted && canSwitch ? 'pointer' : 'default',
        opacity: fainted ? 0.55 : 1,
        transform: active ? 'translateY(-4px)' : 'none',
        transition:'transform 80ms steps(2)',
        fontFamily:'"Pixelify Sans", monospace',
        display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
      }}>
      {/* type chip top-right */}
      <div style={{
        position:'absolute', top: -4, right: -4,
        background: t.primary, color:'#fff',
        fontSize: 8, fontWeight: 800, padding:'1px 4px',
        letterSpacing: 1, boxShadow:`0 0 0 1px ${t.dark}`,
      }}>{t.name.slice(0,3)}</div>
      {/* active marker */}
      {active && (
        <div style={{
          position:'absolute', top: -10, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12, color:'#8c5c10', fontWeight: 900,
        }}>▼</div>
      )}
      {/* fainted X */}
      {fainted && (
        <div style={{
          position:'absolute', inset: 0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 28, color:'#e84050', fontWeight: 900, pointerEvents:'none',
        }}>✕</div>
      )}
      <div style={{ height: 32, display:'flex', alignItems:'flex-end' }}>
        <PixSprite rows={cr.sprite} palette={cr.palette} scale={2} />
      </div>
      <div style={{ fontSize: 9, fontWeight: 800,
        color: active ? '#382800' : P.textDark, letterSpacing: 1,
      }}>{cr.name}</div>
      {/* mini HP bar */}
      <div style={{
        width: 64, height: 4,
        background:'#383850',
        position:'relative',
        boxShadow:`0 0 0 1px ${P.boxBorder}`,
      }}>
        <div style={{
          position:'absolute', left:0, top:0, bottom:0,
          width: `${ratio * 100}%`,
          background: fill,
        }}/>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700,
        color: active ? '#382800' : P.textDark,
      }}>{member.hp}/{member.maxHp}</div>
    </div>
  );
}

// ─── Damage-mod popup (STAB!, ×0.6, ×1.5) ────────────────────
function DamageModBadge({ stab, effectiveness }) {
  const lines = [];
  if (stab && stab > 1) lines.push({ text:'STAB!', color:'#f5c424' });
  if (effectiveness && effectiveness > 1.1) lines.push({ text:'SUPER EFFECTIVE!', color:'#48d048' });
  else if (effectiveness && effectiveness < 0.9) lines.push({ text:'NOT VERY EFFECTIVE…', color:'#a89c84' });
  if (lines.length === 0) return null;
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap: 2,
      fontFamily:'"Pixelify Sans", monospace',
    }}>
      {lines.map((l, i) =>
        <div key={i} style={{
          background: l.color,
          color:'#1a1830', fontSize: 11, fontWeight: 900,
          padding:'2px 8px', letterSpacing: 1,
          boxShadow:`0 0 0 2px #1a1830`,
          clipPath:'polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)',
        }}>{l.text}</div>
      )}
    </div>
  );
}

Object.assign(window, {
  PixSprite, CreatureSprite, PixBox, PixButton, NamePlate, StatusChip,
  PixCard, EnergyPip, BattleBackdrop, Platform, IntentBadge,
  TeamSlot, DamageModBadge,
});
})();
