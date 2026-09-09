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
import {Kicker} from '../components/overlays';
import {Ring} from '../components/PanViewport';

// Scene 07 — the engineering wow beat.
//   "Now the rewrite — upload the revision. Because the queries are deterministic,
//    unchanged items carry their verdicts forward: thirty-nine of forty-four came
//    straight over, only the changes were researched, and the run finished in
//    under three minutes, not seven."
//
// Two shots:
//   A. replacement-applied.png, pushed in hard on the before/after diff in the
//      script (CAROLINE MERCER struck through, JOSEPHINE STERLING inserted) with
//      a designed diff card so the change reads without narration. REQUIRED beat.
//   B. revise-carryover.png (the 2m58s revision run), panning across the wall of
//      "carried over" badges into Boston Herald's "new" badge, while a stat panel
//      builds in the empty gutter: 39 of 44, then the 2:58 vs 7:21 bars.
//
// Beat frames are keyed to the measured VO (13.52s @ 30fps = 406 frames).
const CUT = 84; // ~2.8s — end of "upload the revision."

// --- multi-keyframe pan over a 1920x1080 source plate --------------------------
type Stop = {at: number; x: number; y: number; zoom: number};

const computeTransform = (stops: Stop[], frame: number) => {
  const ats = stops.map((s) => s.at);
  const opts = {
    extrapolateLeft: 'clamp' as const,
    extrapolateRight: 'clamp' as const,
    easing: Easing.inOut(Easing.ease),
  };
  const zoom = interpolate(frame, ats, stops.map((s) => s.zoom), opts);
  const fx = interpolate(frame, ats, stops.map((s) => s.x), opts);
  const fy = interpolate(frame, ats, stops.map((s) => s.y), opts);
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  const tx = clamp(960 - fx * zoom, 1920 - 1920 * zoom, 0);
  const ty = clamp(540 - fy * zoom, 1080 - 1080 * zoom, 0);
  return `translate(${tx}px, ${ty}px) scale(${zoom})`;
};

// --- before/after diff card ----------------------------------------------------
const DiffCard: React.FC<{appearAt: number}> = ({appearAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const insert = spring({
    frame: frame - appearAt - 12,
    fps,
    config: {damping: 16, mass: 0.5},
  });
  const glow = interpolate(
    frame,
    [appearAt + 12, appearAt + 22, appearAt + 52],
    [0, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const row: React.CSSProperties = {
    fontFamily: theme.fonts.mono,
    fontSize: 34,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    whiteSpace: 'nowrap',
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 128,
        opacity,
        transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)`,
        backgroundColor: 'rgba(14, 15, 19, 0.985)',
        border: `1px solid ${theme.colors.hairline}`,
        borderRadius: 16,
        padding: '30px 38px',
        boxShadow: '0 22px 60px rgba(0,0,0,0.55)',
      }}
    >
      <Kicker style={{fontSize: 17, marginBottom: 20}}>one replacement applied</Kicker>
      <div style={{...row, color: theme.colors.conflict, opacity: 0.85}}>
        <span style={{width: 22, textAlign: 'center'}}>&minus;</span>
        <span style={{textDecoration: 'line-through'}}>CAROLINE MERCER</span>
      </div>
      <div style={{height: 12}} />
      <div
        style={{
          ...row,
          color: theme.colors.clear,
          transform: `translateX(${interpolate(insert, [0, 1], [-18, 0])}px)`,
          textShadow: `0 0 ${glow * 26}px ${theme.colors.clear}`,
        }}
      >
        <span style={{width: 22, textAlign: 'center'}}>+</span>
        <span>JOSEPHINE STERLING</span>
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: theme.fonts.sans,
          fontSize: 21,
          color: theme.colors.textDim,
        }}
      >
        re-clear only what changed
      </div>
    </div>
  );
};

// --- stat panel that builds in the empty gutter of the revision shot -----------
const StatLine: React.FC<{appearAt: number; children: React.ReactNode}> = ({
  appearAt,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

const TimeBar: React.FC<{
  label: string;
  time: string;
  ratio: number;
  appearAt: number;
  dim: boolean;
}> = ({label, time, ratio, appearAt, dim}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const grow = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{opacity, display: 'flex', alignItems: 'center', gap: 22}}>
      <div
        style={{
          width: 168,
          fontFamily: theme.fonts.sans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: theme.colors.textDim,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 16,
          borderRadius: 8,
          width: grow * 560 * ratio,
          backgroundColor: dim
            ? 'rgba(244,241,234,0.24)'
            : 'rgba(244,241,234,0.92)',
        }}
      />
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 30,
          fontWeight: 500,
          color: dim ? theme.colors.textDim : theme.colors.text,
        }}
      >
        {time}
      </div>
    </div>
  );
};

export const Scene07RevisionLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'}
  );

  // ---------------- Shot A: the diff flash ----------------
  const diffTransform = computeTransform(
    [
      {at: 0, x: 960, y: 540, zoom: 1.0},
      {at: 16, x: 940, y: 560, zoom: 1.04},
      {at: 74, x: 735, y: 604, zoom: 1.95},
      {at: CUT, x: 733, y: 606, zoom: 1.97},
    ],
    frame
  );

  if (frame < CUT) {
    return (
      <AbsoluteFill style={{backgroundColor: theme.colors.bg, opacity: fadeIn}}>
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <div
            style={{
              position: 'absolute',
              width: 1920,
              height: 1080,
              transform: diffTransform,
              transformOrigin: '0 0',
            }}
          >
            <Img
              src={staticFile('assets/replacement-applied.png')}
              style={{width: 1920, height: 1080}}
            />
            {/* both occurrences of the struck-through name in the script */}
            <Ring
              x={478}
              y={510}
              w={510}
              h={54}
              color={theme.colors.clear}
              appearAt={34}
            />
            <Ring
              x={600}
              y={674}
              w={292}
              h={34}
              color={theme.colors.clear}
              appearAt={40}
            />
          </div>
        </AbsoluteFill>
        <DiffCard appearAt={30} />
      </AbsoluteFill>
    );
  }

  // ---------------- Shot B: the carryover run ----------------
  const local = frame - CUT;
  const end = durationInFrames - CUT;
  const revTransform = computeTransform(
    [
      // 1.0 -> 1.14 @ x=980 pushed ~100px of the ledger sidebar out of frame,
      // clipping the "New script" button and the category labels to "per"/"br"/
      // "busin". Settle in from 1.06 to 1.0 instead: the establishing beat keeps
      // moving but resolves to the whole, uncropped board before the punch-in.
      {at: 0, x: 960, y: 500, zoom: 1.06},
      {at: 34, x: 960, y: 540, zoom: 1.0},
      {at: 112, x: 1700, y: 330, zoom: 1.95},
      {at: 186, x: 1700, y: 640, zoom: 1.95},
      {at: Math.max(end, 200), x: 1700, y: 700, zoom: 1.86},
    ],
    local
  );

  const headerNoteOpacity = interpolate(local, [8, 20, 62, 76], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panelOpacity = interpolate(local, [96, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const growA = interpolate(local, [164, 186], [0, 97], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
  const growB = interpolate(local, [220, 242], [0, 126], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  // carried-over badges in the ledger (source pixel coords of revise-carryover.png).
  // `at` values are scene-relative frames — Ring reads useCurrentFrame().
  const carried: {x: number; y: number; w: number; h: number; at: number}[] = [
    {x: 1630, y: 148, w: 96, h: 22, at: CUT + 96},
    {x: 1614, y: 231, w: 96, h: 22, at: CUT + 104},
    {x: 1771, y: 296, w: 82, h: 42, at: CUT + 112},
    {x: 1622, y: 380, w: 96, h: 22, at: CUT + 120},
    {x: 1690, y: 445, w: 96, h: 22, at: CUT + 128},
  ];

  return (
    <AbsoluteFill
      style={{backgroundColor: theme.colors.bg, opacity: fadeIn * fadeOut}}
    >
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: 1080,
            transform: revTransform,
            transformOrigin: '0 0',
          }}
        >
          <Img
            src={staticFile('assets/revise-carryover.png')}
            style={{width: 1920, height: 1080}}
          />
          {/* the "revision of <job>" chip in the header */}
          <div style={{opacity: headerNoteOpacity}}>
            <Ring
              x={639}
              y={16}
              w={172}
              h={32}
              color={theme.colors.text}
              appearAt={CUT + 8}
            />
          </div>
          {carried.map((c) => (
            <Ring
              key={`${c.x}-${c.y}`}
              x={c.x}
              y={c.y}
              w={c.w}
              h={c.h}
              color={theme.colors.text}
              appearAt={c.at}
            />
          ))}
          {/* Boston Herald — the one genuinely new item */}
          <Ring
            x={1668}
            y={767}
            w={58}
            h={22}
            color={theme.colors.conflict}
            appearAt={CUT + 178}
          />
        </div>
      </AbsoluteFill>

      {/* header note, screen space, only while we are still wide */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          bottom: 110,
          opacity: headerNoteOpacity,
          backgroundColor: 'rgba(14, 15, 19, 0.985)',
          border: `1px solid ${theme.colors.hairline}`,
          borderRadius: 14,
          padding: '22px 28px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        }}
      >
        <Kicker style={{fontSize: 17, marginBottom: 12}}>the rewrite</Kicker>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 27,
            color: theme.colors.text,
          }}
        >
          revision of 6b1b3eacd1dd
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: theme.fonts.sans,
            fontSize: 21,
            color: theme.colors.textDim,
          }}
        >
          same templated queries &rarr; same items
        </div>
      </div>

      {/* stat panel, in the empty gutter left of the ledger */}
      <div
        style={{
          position: 'absolute',
          left: 108,
          top: 152,
          width: 880,
          opacity: panelOpacity,
          backgroundColor: 'rgba(14, 15, 19, 0.985)',
          border: `1px solid ${theme.colors.hairline}`,
          borderRadius: 18,
          padding: '38px 44px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
        }}
      >
        <StatLine appearAt={CUT + 102}>
          <Kicker style={{fontSize: 17}}>carried forward</Kicker>
          <div
            style={{
              marginTop: 16,
              fontFamily: theme.fonts.serif,
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1,
              color: theme.colors.text,
            }}
          >
            39 of 44
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: theme.fonts.sans,
              fontSize: 28,
              color: theme.colors.textDim,
            }}
          >
            verdicts reused, not re-researched
          </div>
        </StatLine>

        {/* the panel grows as each beat lands — no space reserved for copy
            that has not arrived yet */}
        <div style={{height: growA, overflow: 'hidden'}}>
          <div
            style={{
              height: 1,
              backgroundColor: theme.colors.hairline,
              margin: '30px 0',
            }}
          />
          <StatLine appearAt={CUT + 172}>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 26,
                fontWeight: 500,
                color: theme.colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.colors.conflict,
                  display: 'inline-block',
                }}
              />
              only the changed items were researched again
            </div>
          </StatLine>
        </div>

        <div style={{height: growB, overflow: 'hidden'}}>
          <div style={{height: 34}} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            <TimeBar
              label="first pass"
              time="7:21"
              ratio={1}
              appearAt={CUT + 228}
              dim
            />
            <TimeBar
              label="revision"
              time="2:58"
              ratio={178 / 441}
              appearAt={CUT + 240}
              dim={false}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
