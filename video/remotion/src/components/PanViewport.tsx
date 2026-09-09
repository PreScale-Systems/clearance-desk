import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

export type Focus = {
  x: number; // focus point in 1920x1080 source coordinates
  y: number;
  zoom: number; // 1 = image fits viewport width
};

// A fixed-size viewport that slowly pans/zooms a 1920x1080 canvas (screenshot +
// overlays positioned in source pixels). Overlay children ride the transform.
export const PanViewport: React.FC<{
  w: number;
  h: number;
  from: Focus;
  to: Focus;
  startFrame?: number;
  endFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({w, h, from, to, startFrame = 0, endFrame, children, style}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
  const zoom = from.zoom + (to.zoom - from.zoom) * t;
  const fx = from.x + (to.x - from.x) * t;
  const fy = from.y + (to.y - from.y) * t;
  const s = (w / 1920) * zoom;
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  const rawTx = w / 2 - fx * s;
  const rawTy = h / 2 - fy * s;
  const tx = 1920 * s >= w ? clamp(rawTx, w - 1920 * s, 0) : (w - 1920 * s) / 2;
  const ty = 1080 * s >= h ? clamp(rawTy, h - 1080 * s, 0) : (h - 1080 * s) / 2;
  return (
    <div style={{width: w, height: h, overflow: 'hidden', position: 'relative', ...style}}>
      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: 1080,
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Pulsing highlight ring, positioned in source-pixel coordinates (place inside
// PanViewport so it tracks the pan/zoom).
export const Ring: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  appearAt?: number;
}> = ({x, y, w, h, color, appearAt = 0}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [appearAt, appearAt + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 1 + 0.03 * Math.sin((frame - appearAt) / 7);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        border: `3px solid ${color}`,
        borderRadius: 10,
        boxShadow: `0 0 0 6px ${color}22, 0 0 24px ${color}55`,
        opacity,
        transform: `scale(${pulse})`,
      }}
    />
  );
};
