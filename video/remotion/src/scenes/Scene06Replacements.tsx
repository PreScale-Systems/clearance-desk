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

// Scene 06 — "Verified Replacements".
// A type beat on the argument ("a conflict list with fixes is a product"), then the
// real CAROLINE MERCER entry: both script occurrences ringed, a pan to the replacement
// chips, the literal `searched:` line ringed as proof the alternatives were re-queried,
// and a push onto JOSEPHINE STERLING's verified-clean checkmark.
//
// Deliberately count-free, per the script: the footage shows one unverified and two
// verified alternatives.

const CUT = 140; // type card -> alternatives.png

// alternatives.png source coordinates.
const MERCER_A = {x: 764, y: 288, w: 134, h: 28}; // "CAROLINE MERCER" in the email line
const MERCER_B = {x: 600, y: 451, w: 136, h: 28}; // "CAROLINE MERCER" in the scene action
const SEARCHED = {x: 1490, y: 958, w: 396, h: 60}; // the literal `searched:` queries
const STERLING = {x: 1640, y: 892, w: 174, h: 34}; // JOSEPHINE STERLING ✓ chip

const SEARCHED_AT = 296;
const STERLING_AT = 362;

const kf = (frame: number, fs: number[], vs: number[]) =>
  interpolate(frame, fs, vs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

export const Scene06Replacements: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // ---------- beat 1: the argument ----------
  if (frame < CUT) {
    const line = (at: number) => {
      const s = spring({frame: frame - at, fps, config: {damping: 200}});
      const o = interpolate(frame, [at, at + 14], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return {opacity: o, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`};
    };
    return (
      <AbsoluteFill
        style={{
          backgroundColor: theme.colors.bg,
          justifyContent: 'center',
          padding: theme.margin,
        }}
      >
        <div style={{maxWidth: 1500}}>
          <div
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 76,
              fontWeight: 400,
              lineHeight: 1.2,
              color: theme.colors.textDim,
              ...line(6),
            }}
          >
            A conflict list is a problem.
          </div>
          <div
            style={{
              marginTop: 34,
              fontFamily: theme.fonts.serif,
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.15,
              color: theme.colors.text,
              ...line(66),
            }}
          >
            A conflict list with fixes
            <br />
            is a <span style={{color: theme.colors.clear}}>product</span>.
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------- beat 2-4: the real replacement chips ----------
  const end = Math.max(durationInFrames, 452);
  const zoom = kf(frame, [CUT, 216, 300, STERLING_AT, end], [1.34, 1.34, 1.95, 1.95, 2.2]);
  const fx = kf(frame, [CUT, 216, 300, STERLING_AT, end], [760, 760, 1690, 1690, 1727]);
  const fy = kf(frame, [CUT, 216, 300, STERLING_AT, end], [382, 396, 800, 800, 909]);

  // The annotation arrow only shows while the pan is parked on the chip row.
  const arrow = interpolate(frame, [SEARCHED_AT + 8, SEARCHED_AT + 22, 352, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
          src={staticFile('assets/alternatives.png')}
          style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}
        />
        <Ring {...MERCER_A} color={theme.colors.conflict} appearAt={CUT + 10} />
        <Ring {...MERCER_B} color={theme.colors.conflict} appearAt={CUT + 22} />
        <Ring {...SEARCHED} color={theme.colors.bg} appearAt={SEARCHED_AT} />
        <Ring {...STERLING} color={theme.colors.clear} appearAt={STERLING_AT} />
      </PanViewport>

      {/* who we are fixing */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 800,
          opacity: interpolate(frame, [258, 274], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <Callout appearAt={CUT + 12} style={{width: 500}}>
          <Kicker>Conflict · person</Kicker>
          <div style={{marginTop: 12, fontSize: 34, fontWeight: 500}}>Caroline Mercer</div>
          <div style={{marginTop: 8, fontSize: 24, color: theme.colors.textDim}}>
            the prosecutor character
          </div>
        </Callout>
      </div>

      {/* the annotation: what happened to each proposed replacement */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 806,
          opacity: interpolate(frame, [SEARCHED_AT - 22, SEARCHED_AT - 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <Callout appearAt={SEARCHED_AT - 22} style={{width: 470}}>
          <Kicker>Each replacement</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: theme.fonts.mono,
              fontSize: 22,
              lineHeight: 1.55,
              color: theme.colors.text,
            }}
          >
            searched again via Parallel
            <br />
            → judged again
            <br />→ <span style={{color: theme.colors.clear}}>verified</span>
          </div>
        </Callout>
      </div>

      {/* arrow from the annotation to the literal `searched:` line */}
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          opacity: arrow,
        }}
        viewBox="0 0 1920 1080"
      >
        <path
          d="M 620 900 L 1028 900"
          stroke="rgba(14,15,19,0.75)"
          strokeWidth={4}
          fill="none"
        />
        <path d="M 1050 900 L 1024 887 L 1024 913 Z" fill="rgba(14,15,19,0.75)" />
      </svg>

      {/* the payoff */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 214,
          opacity: interpolate(frame, [STERLING_AT, STERLING_AT + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <Callout appearAt={STERLING_AT} style={{width: 520}}>
          <Kicker>Proposed replacement</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: theme.fonts.serif,
              fontSize: 48,
              fontWeight: 600,
              color: theme.colors.text,
            }}
          >
            Josephine Sterling
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 27,
              fontWeight: 600,
              color: theme.colors.clear,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                border: `2px solid ${theme.colors.clear}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ✓
            </span>
            verified clean before it was shown
          </div>
        </Callout>
      </div>
    </AbsoluteFill>
  );
};
