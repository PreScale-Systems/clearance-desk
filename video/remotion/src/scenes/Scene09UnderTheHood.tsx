import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';
import {Badge, Kicker} from '../components/overlays';

// Scene 09 — under the hood.
//   "Under the hood: one Google ADK sequential agent, five stages. Gemini where
//    judgment lives — reading the draft, weighing evidence, writing the memo.
//    Parallel Search for all the research, on templated queries. That split is
//    what makes revisions trustworthy."
//
// Built entirely in JSX/SVG (no screenshot) so the five stages are legible at
// 1080p. "Colour-coding" is done with a spotlight rather than new hues, because
// the design system reserves green/amber/red for verdicts: stages light up while
// the narration is on them and dim to 32% otherwise.
//
// Beats (scene frames, keyed to the measured 15.12s VO):
const BEAT_GEMINI = 108; // "Gemini where judgment lives..."
const BEAT_PARALLEL = 258; // "Parallel Search for all the research..."
const BEAT_SPLIT = 357; // "That split is what makes revisions trustworthy."

type Engine = 'gemini' | 'parallel' | 'both';

const STAGES: {
  n: string;
  name: string;
  model: string;
  does: string;
  engine: Engine;
}[] = [
  {
    n: '01',
    name: 'extractor',
    model: 'Gemini 2.5 Pro',
    does: 'reads the draft, pulls every clearance-sensitive item',
    engine: 'gemini',
  },
  {
    n: '02',
    name: 'researcher',
    model: 'Parallel Search API',
    does: '2–3 templated queries per item, mode: fast',
    engine: 'parallel',
  },
  {
    n: '03',
    name: 'judge',
    model: 'Gemini 2.5 Flash',
    does: 'weighs the evidence → clear / caution / conflict',
    engine: 'gemini',
  },
  {
    n: '04',
    name: 'remediator',
    model: 'Parallel + Gemini',
    does: 're-searches replacement names, verifies them clean',
    engine: 'both',
  },
  {
    n: '05',
    name: 'reporter',
    model: 'Gemini 2.5 Pro',
    does: 'writes the attorney-style memo',
    engine: 'gemini',
  },
];

const CARD_W = 300;
const GAP = 30;
const BOX_LEFT = 100;
const BOX_TOP = 292;
const BOX_W = 1720;
const BOX_H = 408;

const Arrow: React.FC<{left: number; top: number; appearAt: number}> = ({
  left,
  top,
  appearAt,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [appearAt, appearAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg
      width={GAP}
      height={16}
      viewBox={`0 0 ${GAP} 16`}
      style={{position: 'absolute', left, top}}
    >
      <line
        x1={0}
        y1={8}
        x2={GAP * draw}
        y2={8}
        stroke={theme.colors.text}
        strokeOpacity={0.45}
        strokeWidth={2}
      />
      <path
        d={`M ${GAP - 8} 3 L ${GAP - 1} 8 L ${GAP - 8} 13`}
        fill="none"
        stroke={theme.colors.text}
        strokeOpacity={0.45 * Math.max(0, (draw - 0.7) / 0.3)}
        strokeWidth={2}
      />
    </svg>
  );
};

export const Scene09UnderTheHood: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'}
  );

  const headRise = spring({frame, fps, config: {damping: 200}});
  const headOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const boxIn = spring({frame: frame - 18, fps, config: {damping: 200}});
  const boxOpacity = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Spotlight: 1 = lit, REST = resting. 0.32 made the resting stage's body copy
  // effectively unreadable for ~5s at a time — and for the Parallel Search stage
  // that is 5s of the sponsor's box being invisible. 0.55 still reads as "not the
  // one we're talking about" while staying legible.
  const REST = 0.55;
  const geminiLit = interpolate(
    frame,
    [BEAT_GEMINI - 12, BEAT_GEMINI + 6, BEAT_PARALLEL - 12, BEAT_PARALLEL + 6,
     BEAT_SPLIT - 12, BEAT_SPLIT + 6],
    [1, 1, 1, REST, REST, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const parallelLit = interpolate(
    frame,
    [BEAT_GEMINI - 12, BEAT_GEMINI + 6, BEAT_PARALLEL - 12, BEAT_PARALLEL + 6,
     BEAT_SPLIT - 12, BEAT_SPLIT + 6],
    [1, REST, REST, 1, 1, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  // Between beats the diagram was pixel-identical for 4.5s at a stretch
  // (freezedetect flagged 12.5s of this 15.5s scene). A slow push keeps it alive.
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.022], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const splitOpacity = interpolate(frame, [BEAT_SPLIT - 6, BEAT_SPLIT + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badgesOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const innerLeft = BOX_LEFT + (BOX_W - (STAGES.length * CARD_W + 4 * GAP)) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        opacity: fadeIn * fadeOut,
        transform: `scale(${drift})`,
        transformOrigin: '50% 46%',
      }}
    >
      {/* headline */}
      <div
        style={{
          position: 'absolute',
          left: theme.margin,
          top: 92,
          opacity: headOpacity,
          transform: `translateY(${interpolate(headRise, [0, 1], [30, 0])}px)`,
        }}
      >
        <Kicker>under the hood</Kicker>
        <h1
          style={{
            margin: '22px 0 0 0',
            fontFamily: theme.fonts.serif,
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.1,
            color: theme.colors.text,
          }}
        >
          One agent. Five stages.
        </h1>
      </div>

      {/* SequentialAgent container */}
      <div
        style={{
          position: 'absolute',
          left: BOX_LEFT,
          top: BOX_TOP,
          width: BOX_W,
          height: BOX_H,
          borderRadius: 24,
          border: `1px solid ${theme.colors.hairline}`,
          backgroundColor: 'rgba(244, 241, 234, 0.025)',
          opacity: boxOpacity,
          transform: `scale(${interpolate(boxIn, [0, 1], [0.985, 1])})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: BOX_LEFT + 44,
          top: BOX_TOP - 20,
          opacity: boxOpacity,
          backgroundColor: theme.colors.bg,
          padding: '0 18px',
          fontFamily: theme.fonts.sans,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: theme.colors.textDim,
        }}
      >
        Google ADK · SequentialAgent
      </div>

      {/* five stages */}
      {STAGES.map((stage, i) => {
        const left = innerLeft + i * (CARD_W + GAP);
        const s = spring({
          frame: frame - (34 + i * 9),
          fps,
          config: {damping: 200},
        });
        const enter = interpolate(frame, [34 + i * 9, 34 + i * 9 + 14], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const lit =
          stage.engine === 'gemini'
            ? geminiLit
            : stage.engine === 'parallel'
              ? parallelLit
              : Math.max(geminiLit, parallelLit);
        const isParallel = stage.engine !== 'gemini';
        return (
          <div
            key={stage.n}
            style={{
              position: 'absolute',
              left,
              top: BOX_TOP + 66,
              width: CARD_W,
              height: BOX_H - 132,
              boxSizing: 'border-box',
              borderRadius: 16,
              padding: '26px 24px',
              // Gemini stages read as solid panels, Parallel stages as outlined
              // ones — hue stays reserved for verdicts.
              backgroundColor: isParallel
                ? 'transparent'
                : 'rgba(244, 241, 234, 0.06)',
              border: isParallel
                ? `1px dashed rgba(244, 241, 234, 0.34)`
                : `1px solid ${theme.colors.hairline}`,
              opacity: enter * lit,
              transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 20,
                color: theme.colors.textDim,
              }}
            >
              {stage.n}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: theme.fonts.serif,
                fontSize: 38,
                fontWeight: 600,
                color: theme.colors.text,
              }}
            >
              {stage.name}
            </div>
            <div
              style={{
                marginTop: 16,
                alignSelf: 'flex-start',
                fontFamily: theme.fonts.sans,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: theme.colors.text,
                border: `1px solid ${theme.colors.hairline}`,
                backgroundColor: 'rgba(244,241,234,0.05)',
                borderRadius: 999,
                padding: '6px 14px',
              }}
            >
              {stage.model}
            </div>
            <div
              style={{
                marginTop: 20,
                fontFamily: theme.fonts.sans,
                fontSize: 19,
                lineHeight: 1.5,
                color: 'rgba(244, 241, 234, 0.7)',
              }}
            >
              {stage.does}
            </div>
          </div>
        );
      })}

      {/* arrows between stages */}
      {STAGES.slice(0, -1).map((stage, i) => (
        <Arrow
          key={`arrow-${stage.n}`}
          left={innerLeft + i * (CARD_W + GAP) + CARD_W}
          top={BOX_TOP + 66 + (BOX_H - 132) / 2 - 8}
          appearAt={48 + i * 9}
        />
      ))}

      {/* the split, stated — first clause rides along under the diagram from the
          top of the scene, the payoff lands on the last line of narration */}
      <div
        style={{
          position: 'absolute',
          left: theme.margin,
          top: 774,
          width: 1620,
          fontFamily: theme.fonts.serif,
          fontSize: 44,
          fontWeight: 400,
          lineHeight: 1.32,
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [66, 86], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            color: `rgba(244, 241, 234, ${0.5 + 0.5 * splitOpacity})`,
          }}
        >
          Gemini judges. Parallel researches &mdash; same queries every run.
        </div>
        <div style={{opacity: splitOpacity, color: theme.colors.text}}>
          That split is what makes a revision trustworthy.
        </div>
      </div>

      {/* platform badges */}
      <div
        style={{
          position: 'absolute',
          left: theme.margin,
          bottom: 62,
          display: 'flex',
          gap: 18,
          opacity: badgesOpacity,
        }}
      >
        <Badge>Google ADK</Badge>
        <Badge>Vertex AI</Badge>
        <Badge>Parallel Search API</Badge>
        <Badge>Cloud Run</Badge>
        <Badge>Firestore</Badge>
      </div>
    </AbsoluteFill>
  );
};
