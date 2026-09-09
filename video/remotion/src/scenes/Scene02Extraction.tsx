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

// Scene 02 — "Upload and Extraction".
// Beat A: the real landing page, pushing into the sample picker, THE LEDGER clicked.
// Beat B: the running job's script column with clearance highlights painted, while a
//         stage pill moves Reading -> Searching and a counter ticks to 48 items.
//
// Footage: home.png (job 8b5d791e07d4 not yet started) then clearing-pending.png.
// The pan on beat B is framed to source x < 1480 so the right-hand ledger (which
// belongs to a different run than the 48-item job) never enters frame.

const CUT = 122; // hard cut from landing page to the running job

// Sample-picker button "THE LEDGER — first draft" in home.png source pixels.
const SAMPLE = {x: 872, y: 546, w: 214, h: 38};

const CATEGORIES = ['names', 'businesses', 'brands', 'songs', 'addresses'];
const CATEGORY_START = 152;
const CATEGORY_STEP = 17;

const COUNT_FROM = 300;
const COUNT_TO = 392;

const kf = (frame: number, fs: number[], vs: number[]) =>
  interpolate(frame, fs, vs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

// Expanding ring + cursor dot on the sample button.
const ClickPulse: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const scale = interpolate(t, [0, 26], [0.3, 2.6], {extrapolateRight: 'clamp'});
  const opacity = interpolate(t, [0, 6, 26], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 34,
        top: y - 34,
        width: 68,
        height: 68,
        borderRadius: 34,
        border: `3px solid ${theme.colors.bg}`,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export const Scene02Extraction: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // ---------- Beat A: the landing page ----------
  if (frame < CUT) {
    // Picks up roughly where Scene 01 parked (focus ~960,534 @ 1.06) and pushes in
    // on the sample picker so the cut between scenes reads as one continuous move.
    const zoom = kf(frame, [0, 108], [1.06, 1.52]);
    const fy = kf(frame, [0, 108], [534, 565]);
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
            src={staticFile('assets/home.png')}
            style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
          />
          <Ring
            x={SAMPLE.x}
            y={SAMPLE.y}
            w={SAMPLE.w}
            h={SAMPLE.h}
            color={theme.colors.bg}
            appearAt={18}
          />
          <ClickPulse x={SAMPLE.x + SAMPLE.w / 2} y={SAMPLE.y + SAMPLE.h / 2} at={54} />
        </PanViewport>

        <div style={{position: 'absolute', left: 90, top: 150}}>
          <Callout appearAt={26} style={{width: 470}}>
            <Kicker>Sample draft</Kicker>
            <div
              style={{
                marginTop: 14,
                fontFamily: theme.fonts.serif,
                fontSize: 42,
                fontWeight: 600,
                color: theme.colors.text,
              }}
            >
              The Ledger
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                color: theme.colors.textDim,
              }}
            >
              a Boston legal thriller
            </div>
          </Callout>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------- Beat B: the job running over the real script ----------
  const local = frame - CUT;
  const zoom = kf(local, [0, durationInFrames - CUT], [1.3, 1.44]);
  const fy = kf(local, [0, durationInFrames - CUT], [455, 700]);

  const stageSwap = interpolate(local, [92, 108], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dot = 0.55 + 0.45 * Math.sin(local / 5);

  const count = Math.round(
    interpolate(frame, [COUNT_FROM, COUNT_TO], [0, 48], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
  );
  const countIn = spring({frame: frame - COUNT_FROM, fps, config: {damping: 200}});

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      <PanViewport
        w={1920}
        h={1080}
        from={{x: 740, y: fy, zoom}}
        to={{x: 740, y: fy, zoom}}
        endFrame={1}
      >
        <Img
          src={staticFile('assets/clearing-pending.png')}
          style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
        />
      </PanViewport>

      {/* Stage pill — the app's real ticker copy, restated in our design system */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 88,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          backgroundColor: 'rgba(14, 15, 19, 0.985)',
          border: `1px solid ${theme.colors.hairline}`,
          borderRadius: 999,
          padding: '14px 28px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
          opacity: interpolate(local, [4, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.colors.caution,
            opacity: dot,
          }}
        />
        <span
          style={{
            position: 'relative',
            fontFamily: theme.fonts.sans,
            fontSize: 24,
            fontWeight: 500,
            color: theme.colors.text,
            width: 300,
            height: 30,
          }}
        >
          <span style={{position: 'absolute', left: 0, top: 0, opacity: 1 - stageSwap}}>
            Reading the script
          </span>
          <span style={{position: 'absolute', left: 0, top: 0, opacity: stageSwap}}>
            Searching the live web
          </span>
        </span>
      </div>

      {/* What Gemini pulls out of the draft */}
      <div style={{position: 'absolute', left: 90, top: 250}}>
        <Callout appearAt={CATEGORY_START - 16} style={{width: 440}}>
          <Kicker>Extracted by Gemini</Kicker>
          <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14}}>
            {CATEGORIES.map((c, i) => {
              const at = CATEGORY_START + i * CATEGORY_STEP;
              const o = interpolate(frame, [at, at + 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const s = spring({frame: frame - at, fps, config: {damping: 200}});
              return (
                <div
                  key={c}
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    color: theme.colors.text,
                    opacity: o,
                    transform: `translateX(${interpolate(s, [0, 1], [18, 0])}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.textDim,
                    }}
                  />
                  {c}
                </div>
              );
            })}
          </div>
        </Callout>
      </div>

      {/* The count landing */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 690,
          width: 440,
          opacity: interpolate(frame, [COUNT_FROM - 8, COUNT_FROM + 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `translateY(${interpolate(countIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(14, 15, 19, 0.985)',
            border: `1px solid ${theme.colors.hairline}`,
            borderRadius: 14,
            padding: '26px 30px',
            boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 104,
              fontWeight: 700,
              lineHeight: 1,
              color: theme.colors.text,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: theme.fonts.sans,
              fontSize: 26,
              fontWeight: 500,
              color: theme.colors.text,
            }}
          >
            clearance-sensitive items
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: theme.fonts.sans,
              fontSize: 21,
              color: theme.colors.textDim,
            }}
          >
            each tied to its scene and page
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
