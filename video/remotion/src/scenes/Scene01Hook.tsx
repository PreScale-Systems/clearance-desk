import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';
import {Badge} from '../components/overlays';

// Scene 01 — cold open. Dark title card with sponsor badges + three stat lines
// timed to the narration, then a hard cut to the real landing page on
// "This is Clearance Desk."
//
// EDITOR PASS: the card used to be 15s of motionless type — the first product
// pixel arrived at 15.5s and the frame stopped changing at ~11.5s entirely.
// A real cleared-script plate (done-overview.png: red/amber/green highlights over
// the screenplay + the conflict ledger) now rises behind the type at PLATE_AT and
// keeps drifting for the rest of the card, so a judge sees the working app inside
// the first four seconds and the frame is never static. A center-weighted scrim
// keeps the headline crisp. Timing math is untouched.
const CUT = 452; // ~15.1s — "This is Clearance Desk"
const PLATE_AT = 96; // ~3.2s — first product pixels

const STATS: {text: string; at: number}[] = [
  {text: '$1,000–$5,000 per draft', at: 172},
  {text: '1–3 weeks', at: 248},
  {text: 'restarts on every rewrite', at: 288},
];

// "Errors and omissions insurance — E and O — requires it." lands here in the VO;
// nothing used to be on screen for it, which is what made the tail of the card die.
const EO_AT = 326;

export const Scene01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (frame < CUT) {
    const rise = spring({frame, fps, config: {damping: 200}});
    const headY = interpolate(rise, [0, 1], [40, 0]);
    const headOpacity = interpolate(frame, [0, 20], [0, 1], {
      extrapolateRight: 'clamp',
    });
    const badgeOpacity = interpolate(frame, [30, 48], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    // The cleared script, rising behind the type and never stopping.
    const plateOpacity = interpolate(frame, [PLATE_AT, PLATE_AT + 46], [0, 0.34], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const plateZoom = interpolate(frame, [PLATE_AT, CUT], [1.16, 1.03], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const eoOpacity = interpolate(frame, [EO_AT, EO_AT + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const eoRise = spring({frame: frame - EO_AT, fps, config: {damping: 200}});

    return (
      <AbsoluteFill
        style={{
          backgroundColor: theme.colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.margin,
        }}
      >
        {/* real footage plate — the finished, highlighted draft */}
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <Img
            src={staticFile('assets/done-overview.png')}
            style={{
              width: 1920,
              height: 1080,
              opacity: plateOpacity,
              transform: `scale(${plateZoom})`,
              transformOrigin: '50% 45%',
            }}
          />
        </AbsoluteFill>
        {/* center-weighted scrim: type stays crisp, the app reads at the edges */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse 1080px 560px at 50% 44%, rgba(14,15,19,0.97) 0%, rgba(14,15,19,0.9) 55%, rgba(14,15,19,0.62) 100%)',
          }}
        />

        <div style={{textAlign: 'center', maxWidth: 1500, position: 'relative'}}>
          <h1
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.15,
              color: theme.colors.text,
              margin: 0,
              opacity: headOpacity,
              transform: `translateY(${headY}px)`,
            }}
          >
            Every script gets cleared
            <br />
            before it shoots.
          </h1>

          <div style={{height: 64}} />

          <div style={{display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'center'}}>
            {STATS.map((stat, i) => {
              const s = spring({frame: frame - stat.at, fps, config: {damping: 200}});
              const o = interpolate(frame, [stat.at, stat.at + 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={stat.text}
                  style={{
                    fontFamily: theme.fonts.sans,
                    fontSize: 40,
                    fontWeight: 500,
                    color: theme.colors.text,
                    opacity: o,
                    transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: [
                        theme.colors.conflict,
                        theme.colors.caution,
                        theme.colors.clear,
                      ][i],
                      display: 'inline-block',
                    }}
                  />
                  {stat.text}
                </div>
              );
            })}
          </div>

          {/* the mandate, arriving with the E&O line of the VO */}
          <div
            style={{
              marginTop: 52,
              opacity: eoOpacity,
              transform: `translateY(${interpolate(eoRise, [0, 1], [22, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 220,
                height: 1,
                backgroundColor: theme.colors.hairline,
                margin: '0 auto 30px auto',
              }}
            />
            <div
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 46,
                fontWeight: 400,
                color: theme.colors.text,
              }}
            >
              E&amp;O insurance requires it.
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 90,
            display: 'flex',
            gap: 20,
            opacity: badgeOpacity,
          }}
        >
          <Badge>Parallel Search API</Badge>
          <Badge>Google ADK + Gemini</Badge>
        </div>
      </AbsoluteFill>
    );
  }

  // Hard cut: full-bleed landing page, product name overlaid on the empty left margin.
  const local = frame - CUT;
  // 1.06 shaved the CLEARANCE DESK wordmark off the left edge and sliced the
  // "conflict" label off the counts strip — 1.03 keeps both whole.
  const zoom = interpolate(local, [0, 80], [1.0, 1.03], {
    extrapolateRight: 'clamp',
  });
  const nameSpring = spring({frame: local - 6, fps, config: {damping: 200}});
  const nameOpacity = interpolate(local, [6, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <Img
          src={staticFile('assets/home.png')}
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${zoom})`,
            // Anchored left so the push never eats the CLEARANCE DESK wordmark or
            // the "0 conflict" cell of the counts strip — both bleed to x=0 in the
            // source capture. The crop lands on empty right-hand margin instead.
            transformOrigin: '0% 35%',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 330,
          opacity: nameOpacity,
          transform: `translateY(${interpolate(nameSpring, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(14, 15, 19, 0.985)',
            border: `1px solid ${theme.colors.hairline}`,
            borderRadius: 18,
            padding: '38px 44px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 64,
              fontWeight: 700,
              color: theme.colors.text,
            }}
          >
            Clearance Desk
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: theme.fonts.sans,
              fontSize: 24,
              color: theme.colors.textDim,
            }}
          >
            agentic script clearance
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
