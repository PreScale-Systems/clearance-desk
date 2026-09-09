import React from 'react';
import {theme} from '../theme';

// Rounded browser-chrome frame per the design system. Children fill the body.
export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  width: number;
  style?: React.CSSProperties;
}> = ({children, width, style}) => (
  <div
    style={{
      width,
      backgroundColor: theme.colors.chrome,
      borderRadius: 16,
      overflow: 'hidden',
      border: `1px solid ${theme.colors.hairline}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
      ...style,
    }}
  >
    <div style={{display: 'flex', gap: 8, padding: '14px 18px'}}>
      {['#f87171', '#fbbf24', '#34d399'].map((c) => (
        <div
          key={c}
          style={{width: 12, height: 12, borderRadius: 6, backgroundColor: c}}
        />
      ))}
    </div>
    {children}
  </div>
);
