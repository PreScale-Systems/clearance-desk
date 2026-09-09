import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';
import {Callout, Kicker} from '../components/overlays';
import {PanViewport, Ring} from '../components/PanViewport';

// Scene 05 — "Anatomy of a Conflict". The proof-of-real-research scene.
// Real frames only: done-overview (click the NORTHSTAR row) → conflict-detail
// (script highlight + attorney-style rationale) → conflict-evidence (the Florida
// corporate-registry citation, pushed in and held in silence at the end).

const CLICK_CUT = 50; // done-overview  -> conflict-detail
const EVIDENCE_CUT = 336; // conflict-detail -> conflict-evidence

// done-overview.png: the NORTHSTAR CONSULTING GROUP ledger row.
const LEDGER_ROW = {x: 1488, y: 668, w: 414, h: 56};
// conflict-detail.png: the boxed NORTHSTAR highlight in the screenplay.
const SCRIPT_BOX = {x: 508, y: 524, w: 232, h: 30};
// conflict-evidence.png: the Florida corporate-registry citation.
const REGISTRY = {x: 1490, y: 604, w: 416, h: 100};

const kf = (frame: number, fs: number[], vs: number[]) =>
  interpolate(frame, fs, vs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

const ClickPulse: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const scale = interpolate(t, [0, 24], [0.3, 2.4], {extrapolateRight: 'clamp'});
  const opacity = interpolate(t, [0, 5, 24], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        border: `3px solid ${theme.colors.conflict}`,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export const Scene05Conflict: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // ---------- beat 1: click the conflict in the ledger ----------
  if (frame < CLICK_CUT) {
    return (
      <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
        <PanViewport
          w={1920}
          h={1080}
          from={{x: 1700, y: 700, zoom: 1.25}}
          to={{x: 1700, y: 690, zoom: 1.3}}
          endFrame={CLICK_CUT}
        >
          <Img
            src={staticFile('assets/done-overview.png')}
            style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
          />
          <Ring
            {...LEDGER_ROW}
            color={theme.colors.conflict}
            appearAt={2}
          />
          <ClickPulse
            x={LEDGER_ROW.x + LEDGER_ROW.w / 2}
            y={LEDGER_ROW.y + LEDGER_ROW.h / 2}
            at={14}
          />
        </PanViewport>
        <div style={{position: 'absolute', left: 90, top: 120}}>
          <Callout appearAt={4} style={{width: 400}}>
            <Kicker>Open a conflict</Kicker>
            <div style={{marginTop: 12, fontSize: 30, fontWeight: 500}}>
              Northstar Consulting Group
            </div>
          </Callout>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------- beat 2: the expanded detail panel ----------
  if (frame < EVIDENCE_CUT) {
    // Script highlight → long lateral pan to the verdict → push into the rationale.
    const zoom = kf(frame, [CLICK_CUT, 150, 250, EVIDENCE_CUT], [1.5, 1.5, 1.95, 2.0]);
    const fx = kf(frame, [CLICK_CUT, 150, 250, EVIDENCE_CUT], [700, 700, 1690, 1690]);
    const fy = kf(frame, [CLICK_CUT, 150, 250, EVIDENCE_CUT], [510, 520, 640, 700]);
    return (
      <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
        <PanViewport
          w={1920}
          h={1080}
          from={{x: fx, y: fy, zoom}}
          to={{x: fx, y: fy, zoom}}
          endFrame={1}
        >
          <Img
            src={staticFile('assets/conflict-detail.png')}
            style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
          />
          <Ring
            {...SCRIPT_BOX}
            color={theme.colors.conflict}
            appearAt={CLICK_CUT + 8}
          />
        </PanViewport>

        {/* in-script portrayal, then what the web came back with */}
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 800,
            opacity: interpolate(frame, [188, 204], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <Callout appearAt={CLICK_CUT + 14} style={{width: 520}}>
            <Kicker>In the script</Kicker>
            <div style={{marginTop: 12, fontSize: 28, lineHeight: 1.35, fontWeight: 500}}>
              a shell company receiving suspicious wires
            </div>
          </Callout>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 380,
            opacity: interpolate(frame, [200, 218], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <Callout appearAt={200} style={{width: 580}}>
            <Kicker>On the live web</Kicker>
            <div style={{marginTop: 12, fontSize: 28, lineHeight: 1.35, fontWeight: 500}}>
              real businesses operating under that name
            </div>
          </Callout>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------- beat 3: the citations, held ----------
  const end = Math.max(durationInFrames, 448);
  const zoom = kf(frame, [EVIDENCE_CUT, 430, end], [2.0, 2.18, 2.22]);
  const fy = kf(frame, [EVIDENCE_CUT, 430, end], [700, 656, 650]);

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      <PanViewport
        w={1920}
        h={1080}
        from={{x: 1690, y: fy, zoom}}
        to={{x: 1690, y: fy, zoom}}
        endFrame={1}
      >
        <Img
          src={staticFile('assets/conflict-evidence.png')}
          style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
        />
        <Ring
          {...REGISTRY}
          color={theme.colors.conflict}
          appearAt={EVIDENCE_CUT + 60}
        />
      </PanViewport>

      <div style={{position: 'absolute', left: 110, top: 350}}>
        <Callout appearAt={EVIDENCE_CUT + 14} style={{width: 600}}>
          <Kicker>Cited evidence</Kicker>
          <div style={{marginTop: 14, fontSize: 30, lineHeight: 1.35, fontWeight: 500}}>
            Florida corporate registry — an active
            <br />
            NORTHSTAR CONSULTING GROUP LLC
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 24,
              color: theme.colors.conflict,
              fontWeight: 600,
              opacity: interpolate(
                frame,
                [EVIDENCE_CUT + 60, EVIDENCE_CUT + 76],
                [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
              ),
            }}
          >
            an exact match
          </div>
        </Callout>
      </div>
    </AbsoluteFill>
  );
};
