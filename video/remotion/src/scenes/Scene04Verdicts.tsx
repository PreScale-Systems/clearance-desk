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
import {Callout, Kicker} from '../components/overlays';
import {PanViewport, Ring} from '../components/PanViewport';

// Scene 04 — "Verdicts Land". The money shot.
//
// Part 1 (one continuous run, job 8b5d791e07d4): clearing-pending dissolves into
// clearing-mid, so gray `pending` chips visibly flip to conflict/caution/clear and
// the header counts climb. The status ticker "Weighing the evidence" is ringed.
// Part 2 (job 6b1b3eacd1dd, the finished 48-item run): separated by a deliberate dip
// to black — FOOTAGE.md forbids cutting between runs without a beat change — then the
// finished board plus the stat bar, held in silence after the VO ends.

const DISSOLVE_IN = 112;
const DISSOLVE_OUT = 134;
const DIP_START = 226;
const CUT = 238; // first frame of the finished job
const DIP_END = 250;

const BAR_AT = 250;
const COUNT_FROM = 258;
const COUNT_TO = 330;
const CITED_AT = 358;

const LEGEND: {label: string; color: string; at: number}[] = [
  {label: 'clear', color: theme.colors.clear, at: 146},
  {label: 'caution', color: theme.colors.caution, at: 162},
  {label: 'conflict', color: theme.colors.conflict, at: 178},
];

const kf = (frame: number, fs: number[], vs: number[]) =>
  interpolate(frame, fs, vs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

const useCount = (target: number) => {
  const frame = useCurrentFrame();
  return Math.round(
    interpolate(frame, [COUNT_FROM, COUNT_TO], [0, target], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
  );
};

const Stat: React.FC<{value: number; label: string; color: string}> = ({
  value,
  label,
  color,
}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
    <span
      style={{
        fontFamily: theme.fonts.serif,
        fontSize: 78,
        fontWeight: 700,
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontFamily: theme.fonts.sans,
        fontSize: 28,
        fontWeight: 500,
        color: theme.colors.textDim,
      }}
    >
      {label}
    </span>
  </div>
);

export const Scene04Verdicts: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const conflict = useCount(25);
  const caution = useCount(12);
  const clear = useCount(11);
  const items = useCount(48);

  const barS = spring({frame: frame - BAR_AT, fps, config: {damping: 200}});
  const barO = interpolate(frame, [BAR_AT, BAR_AT + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const dip =
    frame < DIP_START
      ? 0
      : interpolate(frame, [DIP_START, CUT, DIP_END], [0, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // ---------- part 1: verdicts resolving, one run ----------
  if (frame < CUT) {
    // Framed so the header counts (3/2/2 -> 21/11/12) stay in shot through the
    // dissolve — that climb is the point of the beat.
    const zoom = kf(frame, [0, CUT], [1.12, 1.18]);
    const fy = kf(frame, [0, CUT], [455, 500]);
    const mid = interpolate(frame, [DISSOLVE_IN, DISSOLVE_OUT], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
        <PanViewport
          w={1920}
          h={1080}
          from={{x: 1340, y: fy, zoom}}
          to={{x: 1340, y: fy, zoom}}
          endFrame={1}
        >
          <Img
            src={staticFile('assets/clearing-pending.png')}
            style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
          />
          <Img
            src={staticFile('assets/clearing-mid.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1920,
              height: 1080,
              opacity: mid,
            }}
          />
          {/* the status ticker — small in the real UI, so ring it */}
          <div
            style={{
              opacity: interpolate(frame, [118, 138], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <Ring
              x={1486}
              y={10}
              w={196}
              h={42}
              color={theme.colors.caution}
              appearAt={14}
            />
          </div>
        </PanViewport>

        <div style={{position: 'absolute', left: 90, top: 96}}>
          <Callout appearAt={20} style={{width: 430}}>
            <Kicker>Status</Kicker>
            <div style={{marginTop: 12, fontSize: 30, fontWeight: 500}}>
              Weighing the evidence
            </div>
          </Callout>
        </div>

        <div style={{position: 'absolute', left: 90, top: 700}}>
          <Callout appearAt={LEGEND[0].at - 14} style={{width: 430}}>
            <Kicker>Verdicts</Kicker>
            <div
              style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16}}
            >
              {LEGEND.map((l) => {
                const o = interpolate(frame, [l.at, l.at + 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const s = spring({frame: frame - l.at, fps, config: {damping: 200}});
                return (
                  <div
                    key={l.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18,
                      fontSize: 30,
                      fontWeight: 500,
                      color: theme.colors.text,
                      opacity: o,
                      transform: `translateX(${interpolate(s, [0, 1], [16, 0])}px)`,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: l.color,
                      }}
                    />
                    {l.label}
                  </div>
                );
              })}
            </div>
          </Callout>
        </div>

        <AbsoluteFill style={{backgroundColor: '#000', opacity: dip}} />
      </AbsoluteFill>
    );
  }

  // ---------- part 2: the finished job ----------
  const end = Math.max(durationInFrames, CUT + 60);
  // Settle IN, not out: 1.0 -> 1.06 pushed the risk-ledger sidebar past the right
  // edge and clipped the category labels to "per" / "br" / "busin". Reversing it
  // keeps the drift alive while resolving to the full, uncropped board exactly on
  // the stat bar and the silent hold — the frames a judge actually reads.
  const zoom = kf(frame, [CUT, end], [1.045, 1.0]);
  const fy = kf(frame, [CUT, end], [540, 500]);

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      <PanViewport
        w={1920}
        h={1080}
        from={{x: 960, y: fy, zoom}}
        to={{x: 960, y: fy, zoom}}
        endFrame={1}
      >
        <Img
          src={staticFile('assets/done-overview.png')}
          style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
        />
      </PanViewport>

      {/* stat bar — conflict first, matching the app's ledger sort */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 792,
          width: 1640,
          boxSizing: 'border-box',
          backgroundColor: 'rgba(14, 15, 19, 0.99)',
          border: `1px solid ${theme.colors.hairline}`,
          borderRadius: 18,
          padding: '34px 48px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
          opacity: barO,
          transform: `translateY(${interpolate(barS, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Kicker>The Ledger · first draft</Kicker>
            <div
              style={{
                marginTop: 12,
                fontFamily: theme.fonts.serif,
                fontSize: 62,
                fontWeight: 700,
                color: theme.colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {items} items
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 62}}>
            <Stat value={conflict} label="conflict" color={theme.colors.conflict} />
            <Stat value={caution} label="caution" color={theme.colors.caution} />
            <Stat value={clear} label="clear" color={theme.colors.clear} />
          </div>
        </div>
        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: `1px solid ${theme.colors.hairline}`,
            fontFamily: theme.fonts.sans,
            fontSize: 25,
            color: theme.colors.textDim,
            opacity: interpolate(frame, [CITED_AT, CITED_AT + 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          every verdict backed by cited sources
        </div>
      </div>

      <AbsoluteFill style={{backgroundColor: '#000', opacity: dip}} />
    </AbsoluteFill>
  );
};
