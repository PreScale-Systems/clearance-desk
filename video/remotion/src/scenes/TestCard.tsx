// Scaffold verification scene + living example of the design system.
// The remotion developer will replace this with real scenes (one file per scene here).
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {theme} from '../theme';

export const TestCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const rise = spring({frame, fps, config: {damping: 200}});
  const translateY = interpolate(rise, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.margin,
      }}
    >
      <div style={{opacity: fadeIn, transform: `translateY(${translateY}px)`}}>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 24,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: theme.colors.textDim,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Scaffold test
        </div>
        <h1
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 110,
            fontWeight: 600,
            color: theme.colors.text,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Clearance Desk
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 48,
            justifyContent: 'center',
            marginTop: 56,
            fontFamily: theme.fonts.sans,
            fontSize: 28,
          }}
        >
          <span style={{color: theme.colors.clear}}>● clear</span>
          <span style={{color: theme.colors.caution}}>● caution</span>
          <span style={{color: theme.colors.conflict}}>● conflict</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
