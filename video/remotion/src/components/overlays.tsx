import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';

// Dark caption card for the safe left-margin area over light screenshots.
export const Callout: React.FC<{
  appearAt?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({appearAt = 0, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - appearAt, fps, config: {damping: 200}});
  const y = interpolate(s, [0, 1], [24, 0]);
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        // Near-opaque on purpose: at 0.92 the light screenshot underneath ghosted
        // through the card and script lines were legible behind the caption text.
        backgroundColor: 'rgba(14, 15, 19, 0.985)',
        border: `1px solid ${theme.colors.hairline}`,
        borderRadius: 14,
        padding: '22px 28px',
        color: theme.colors.text,
        fontFamily: theme.fonts.sans,
        opacity,
        transform: `translateY(${y}px)`,
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Small uppercase kicker line.
export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: theme.fonts.sans,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      color: theme.colors.textDim,
      ...style,
    }}
  >
    {children}
  </div>
);

// Sponsor / tech badge pill.
export const Badge: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: theme.fonts.sans,
      fontSize: 22,
      fontWeight: 500,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.hairline}`,
      borderRadius: 999,
      padding: '10px 24px',
      backgroundColor: 'rgba(244,241,234,0.04)',
      ...style,
    }}
  >
    {children}
  </div>
);

// Fade the whole scene in at the start and out at the end (editorial cut on black).
export const SceneFade: React.FC<{
  children: React.ReactNode;
  inFrames?: number;
  outFrames?: number;
}> = ({children, inFrames = 8, outFrames = 10}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const fadeIn = interpolate(frame, [0, inFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - outFrames, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'}
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fadeIn * fadeOut}}>
      {children}
    </div>
  );
};
