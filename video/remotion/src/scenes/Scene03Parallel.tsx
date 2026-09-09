import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';
import {Badge, Kicker} from '../components/overlays';
import {BrowserFrame} from '../components/BrowserFrame';
import {PanViewport} from '../components/PanViewport';

// Scene 03 — "Live Research via Parallel".
// Left: a 1:1 crop of the real risk ledger while items are still `pending`.
// Right: the query fan-out — one extracted item spawning the 2-3 templated queries
// that actually go out. Query shapes are copied from the literal `searched:` lines
// in conflict-evidence.png / alternatives.png (name + descriptor + city, name +
// "Contemporary Boston", quoted exact name).

const PANEL = {left: 90, top: 116, w: 480, h: 820};

const ITEM_IN = 30;
const QUERY_AT = [96, 120, 144];
const NODE_AT = 176;
const STAMP_AT = 218;
const TEASE_AT = 262;

const QUERIES = [
  'DANIEL REYES junior partner attorney Boston',
  'DANIEL REYES Contemporary Boston',
  '"DANIEL REYES"',
];

const PILL = {left: 1030, w: 520, tops: [378, 502, 626], h: 76};
const NODE = {left: 1610, top: 428, w: 230, h: 224};

const kf = (frame: number, fs: number[], vs: number[]) =>
  interpolate(frame, fs, vs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

export const Scene03Parallel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Slow drift down the pending ledger for the whole scene. Starts at 436, not
  // 460: at 460 the panel opened mid-way through the conflict/caution/clear
  // counts row, so the digits were sliced in half along the top edge.
  const fy = kf(frame, [0, durationInFrames], [436, 561]);

  const panelIn = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const itemS = spring({frame: frame - ITEM_IN, fps, config: {damping: 200}});
  const itemO = interpolate(frame, [ITEM_IN, ITEM_IN + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nodeS = spring({frame: frame - NODE_AT, fps, config: {damping: 16, mass: 0.7}});
  const nodeGlow = interpolate(frame, [NODE_AT, NODE_AT + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stampO = interpolate(frame, [STAMP_AT, STAMP_AT + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stampS = spring({frame: frame - STAMP_AT, fps, config: {damping: 200}});
  const teaseO = interpolate(frame, [TEASE_AT, TEASE_AT + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardRight = 660 + 330; // right edge of the extracted-item card

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      {/* ---------- left: the real ledger, items still pending ---------- */}
      <div
        style={{
          position: 'absolute',
          left: PANEL.left,
          top: PANEL.top,
          opacity: panelIn,
        }}
      >
        <BrowserFrame width={PANEL.w}>
          <PanViewport
            w={PANEL.w}
            h={PANEL.h}
            from={{x: 1700, y: fy, zoom: 4.36}}
            to={{x: 1700, y: fy, zoom: 4.36}}
            endFrame={1}
          >
            <Img
              src={staticFile('assets/clearing-pending.png')}
              style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
            />
          </PanViewport>
        </BrowserFrame>
        <div style={{marginTop: 22}}>
          <Kicker>Risk ledger · researching</Kicker>
        </div>
      </div>

      {/* ---------- right: query fan-out ---------- */}
      <Kicker style={{position: 'absolute', left: 660, top: 168, opacity: itemO}}>
        2–3 templated queries per item
      </Kicker>

      {/* connectors */}
      <svg
        style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
        viewBox="0 0 1920 1080"
      >
        {QUERY_AT.map((at, i) => {
          const py = PILL.tops[i] + PILL.h / 2;
          const draw = interpolate(frame, [at - 10, at + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const drawB = interpolate(frame, [at + 10, at + 34], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          return (
            <g key={i} fill="none" stroke={theme.colors.hairline} strokeWidth={2}>
              <path
                d={`M ${cardRight} 540 C ${cardRight + 30} 540, ${PILL.left - 30} ${py}, ${PILL.left} ${py}`}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
                stroke="rgba(244,241,234,0.30)"
              />
              <path
                d={`M ${PILL.left + PILL.w} ${py} C ${PILL.left + PILL.w + 30} ${py}, ${NODE.left - 30} 540, ${NODE.left} 540`}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - drawB}
                stroke="rgba(244,241,234,0.30)"
              />
            </g>
          );
        })}
      </svg>

      {/* the extracted item */}
      <div
        style={{
          position: 'absolute',
          left: 660,
          top: 470,
          width: 330,
          padding: '22px 24px',
          boxSizing: 'border-box',
          borderRadius: 14,
          border: `1px solid ${theme.colors.hairline}`,
          backgroundColor: 'rgba(244,241,234,0.04)',
          opacity: itemO,
          transform: `translateY(${interpolate(itemS, [0, 1], [22, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 25,
            color: theme.colors.text,
            letterSpacing: '0.02em',
          }}
        >
          DANIEL REYES
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: theme.fonts.sans,
            fontSize: 19,
            color: theme.colors.textDim,
          }}
        >
          person · Boston attorney
        </div>
      </div>

      {/* the queries */}
      {QUERIES.map((q, i) => {
        const at = QUERY_AT[i];
        const o = interpolate(frame, [at, at + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const s = spring({frame: frame - at, fps, config: {damping: 200}});
        return (
          <div
            key={q}
            style={{
              position: 'absolute',
              left: PILL.left,
              top: PILL.tops[i],
              width: PILL.w,
              height: PILL.h,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              padding: '0 22px',
              borderRadius: 12,
              border: `1px solid ${theme.colors.hairline}`,
              backgroundColor: 'rgba(244,241,234,0.045)',
              fontFamily: theme.fonts.mono,
              fontSize: 17,
              lineHeight: 1.35,
              color: theme.colors.text,
              opacity: o,
              transform: `translateX(${interpolate(s, [0, 1], [-26, 0])}px)`,
            }}
          >
            {q}
          </div>
        );
      })}

      {/* the Parallel node */}
      <div
        style={{
          position: 'absolute',
          left: NODE.left,
          top: NODE.top,
          width: NODE.w,
          height: NODE.h,
          boxSizing: 'border-box',
          borderRadius: 16,
          border: `1px solid rgba(52, 211, 153, ${0.25 + 0.45 * nodeGlow})`,
          backgroundColor: 'rgba(52, 211, 153, 0.06)',
          boxShadow: `0 0 ${40 * nodeGlow}px rgba(52,211,153,${0.28 * nodeGlow})`,
          padding: '26px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transform: `scale(${interpolate(nodeS, [0, 1], [0.94, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.12,
            color: theme.colors.text,
          }}
        >
          Parallel
          <br />
          Search API
        </div>
        <div style={{marginTop: 18}}>
          <Badge
            style={{
              display: 'inline-block',
              fontSize: 17,
              padding: '7px 16px',
              opacity: nodeGlow,
              color: theme.colors.clear,
              borderColor: 'rgba(52,211,153,0.4)',
            }}
          >
            mode: fast
          </Badge>
        </div>
      </div>

      {/* the point of the scene */}
      <div
        style={{
          position: 'absolute',
          left: 660,
          top: 790,
          width: 1180,
          opacity: stampO,
          transform: `translateY(${interpolate(stampS, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 52,
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          The same queries. Every run.
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: theme.fonts.sans,
            fontSize: 26,
            color: theme.colors.textDim,
            opacity: teaseO,
          }}
        >
          deterministic research → verdicts that can be reused
        </div>
      </div>
    </AbsoluteFill>
  );
};
