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
import {Badge, Kicker} from '../components/overlays';
import {PanViewport} from '../components/PanViewport';

// Scene 10 — the close + end card.
//   "Every distributor requires E and O insurance. Every E and O policy requires
//    this report. Nobody has automated it — until now. [0.5s beat]
//    Clearance Desk. Clear a draft in minutes."
//
// The VO already carries the half-second beat after "until now." The dissolve off
// the finished report is timed to land inside it, so the card is clean and empty
// (one hairline drawing itself) when "Clearance Desk." arrives at f234. Nothing
// new appears after the last line — only a slow drift through the tail silence.
const MANDATE: {text: string; at: number}[] = [
  {text: 'Every distributor requires E&O insurance.', at: 6},
  {text: 'Every E&O policy requires this report.', at: 76},
  {text: 'Nobody has automated it.', at: 148},
];

const DISSOLVE_START = 198;
const DISSOLVE_END = 228;
// EDITOR PASS: the fully-assembled card (wordmark + tagline + URL + repo + badges)
// used to exist for under a second before the file ended — a judge could not read,
// let alone copy, the Cloud Run link. Pulled the whole assembly ~20 frames earlier
// so it completes at f306 (~1.7s of finished card) without moving the tagline off
// its VO line. This scene wants ~2.5s more length than durations.json gives it —
// flagged to the coordinator, who owns timeline.ts.
const WORDMARK_AT = 234;
const TAGLINE_AT = 266;
const LINKS_AT = 280;
const BADGES_AT = 292;

const Rise: React.FC<{
  appearAt: number;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({appearAt, distance = 26, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [appearAt, appearAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(s, [0, 1], [distance, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Scene10Close: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  // Cross-dissolve: the finished report goes out, the card comes up.
  const shotOpacity = interpolate(
    frame,
    [DISSOLVE_START, DISSOLVE_END],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const cardOpacity = interpolate(
    frame,
    [DISSOLVE_START + 8, DISSOLVE_END],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  // The half-second beat: a hairline draws itself across the empty card so the
  // silence has motion without carrying information.
  const ruleWidth = interpolate(frame, [DISSOLVE_START + 12, WORDMARK_AT + 26], [0, 460], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tail drift — alive, calm, nothing new.
  const drift = interpolate(frame, [WORDMARK_AT, durationInFrames], [1, 1.014], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const shotDrift = spring({frame, fps, config: {damping: 200}});

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, opacity: fadeIn}}>
      {/* ---- the finished report, one last time ---- */}
      {shotOpacity > 0 ? (
        <AbsoluteFill style={{opacity: shotOpacity}}>
          <PanViewport
            w={1920}
            h={1080}
            from={{x: 1200, y: 420, zoom: 1.25}}
            to={{x: 1268, y: 452, zoom: 1.33}}
            endFrame={DISSOLVE_END}
          >
            <Img
              src={staticFile('assets/memo.png')}
              style={{width: 1920, height: 1080}}
            />
          </PanViewport>

          {/* scrim: dark under the type, clearing toward the ledger on the right */}
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(to right, rgba(14,15,19,0.95) 0%, rgba(14,15,19,0.93) 42%, rgba(14,15,19,0.62) 72%, rgba(14,15,19,0.45) 100%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: theme.margin,
              top: 352,
              width: 1000,
              transform: `translateY(${interpolate(shotDrift, [0, 1], [16, 0])}px)`,
            }}
          >
            <Rise appearAt={0} distance={18}>
              <Kicker>the mandate</Kicker>
            </Rise>
            <div style={{height: 40}} />
            {MANDATE.map((line) => (
              <Rise key={line.text} appearAt={line.at} distance={22}>
                <div
                  style={{
                    fontFamily: theme.fonts.serif,
                    fontSize: 62,
                    fontWeight: 600,
                    lineHeight: 1.22,
                    color: theme.colors.text,
                    marginBottom: 30,
                  }}
                >
                  {line.text}
                </div>
              </Rise>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---- end card ---- */}
      <AbsoluteFill
        style={{
          opacity: cardOpacity,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.margin,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            transform: `scale(${drift})`,
          }}
        >
          <Rise appearAt={WORDMARK_AT} distance={22}>
            <div
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 124,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                color: theme.colors.text,
              }}
            >
              Clearance Desk
            </div>
          </Rise>

          <div
            style={{
              width: ruleWidth,
              height: 1,
              backgroundColor: 'rgba(244, 241, 234, 0.32)',
              margin: '46px auto',
            }}
          />

          <Rise appearAt={TAGLINE_AT} distance={18}>
            <div
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 52,
                fontWeight: 400,
                color: theme.colors.text,
              }}
            >
              Clear a draft in minutes.
            </div>
          </Rise>

          <div style={{height: 58}} />

          <Rise appearAt={LINKS_AT} distance={14}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 25,
                lineHeight: 1.75,
                color: theme.colors.textDim,
              }}
            >
              <div style={{color: 'rgba(244, 241, 234, 0.78)'}}>
                https://clearance-desk-769027363263.us-central1.run.app
              </div>
              <div>github.com/PreScale-Systems/clearance-desk</div>
            </div>
          </Rise>

          <div style={{height: 56}} />

          <Rise appearAt={BADGES_AT} distance={12}>
            <div style={{display: 'flex', gap: 20, justifyContent: 'center'}}>
              <Badge>Parallel Search API</Badge>
              <Badge>Google ADK + Gemini</Badge>
            </div>
          </Rise>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
