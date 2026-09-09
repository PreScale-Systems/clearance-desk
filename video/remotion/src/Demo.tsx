import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {theme} from './theme';
import {getTimeline} from './timeline';

// Wav files are synced into public/audio/ by `npm run sync-assets`.
// Only reference audio for scenes whose wav actually exists (hasAudio below is
// flipped to true once the sound agent has delivered clips + durations.json).
const HAS_AUDIO = true;

export const Demo: React.FC = () => {
  const timeline = getTimeline();

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
      {/* Ambient bed under everything: it exists so the scripted silent holds read
          as beats instead of dropouts. Runs longer than the cut and gets trimmed. */}
      <Audio src={staticFile('audio/bed.wav')} />
      {timeline.map((scene) => {
        const Scene = scene.component;
        return (
          <Sequence
            key={scene.id}
            from={scene.from}
            durationInFrames={scene.durationInFrames}
            name={scene.id}
          >
            <Scene />
            {HAS_AUDIO ? (
              <Audio src={staticFile(`audio/scene-${scene.id}.wav`)} />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
