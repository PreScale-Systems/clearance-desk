import React from 'react';
import {Composition} from 'remotion';
import {Demo} from './Demo';
import {FPS, getTotalDurationInFrames} from './timeline';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Demo"
      component={Demo}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={getTotalDurationInFrames()}
      calculateMetadata={() => {
        // Re-derived from audio/durations.json so total length always tracks narration.
        return {durationInFrames: getTotalDurationInFrames()};
      }}
    />
  );
};
