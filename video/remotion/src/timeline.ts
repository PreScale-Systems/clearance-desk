// Single source of truth for scene order + timing.
// Durations come from audio/durations.json (synced into src/data/ by `npm run sync-assets`)
// — NEVER hardcode scene lengths.
import React from 'react';
import durations from './data/durations.json';
import narration from './data/narration.json';
import {Scene01Hook} from './scenes/Scene01Hook';
import {Scene02Extraction} from './scenes/Scene02Extraction';
import {Scene03Parallel} from './scenes/Scene03Parallel';
import {Scene04Verdicts} from './scenes/Scene04Verdicts';
import {Scene05Conflict} from './scenes/Scene05Conflict';
import {Scene06Replacements} from './scenes/Scene06Replacements';
import {Scene07RevisionLoop} from './scenes/Scene07RevisionLoop';
import {Scene08Report} from './scenes/Scene08Report';
import {Scene09UnderTheHood} from './scenes/Scene09UnderTheHood';
import {Scene10Close} from './scenes/Scene10Close';

export const FPS = 30;

// Silence appended after each scene's narration ends (frames).
export const SCENE_PADDING_FRAMES = 12; // 0.4s of air between scenes

// Fallback used only while durations.json has no entry for a scene
// (e.g. before the sound agent has run). Real renders must not rely on it.
const FALLBACK_SECONDS = 2;

export type SceneDef = {
  id: string;
  component: React.FC;
};

// `id` must match the scene ids in script/narration.json and audio/scene-<id>.wav.
export const scenes: SceneDef[] = [
  {id: '01', component: Scene01Hook},
  {id: '02', component: Scene02Extraction},
  {id: '03', component: Scene03Parallel},
  {id: '04', component: Scene04Verdicts},
  {id: '05', component: Scene05Conflict},
  {id: '06', component: Scene06Replacements},
  {id: '07', component: Scene07RevisionLoop},
  {id: '08', component: Scene08Report},
  {id: '09', component: Scene09UnderTheHood},
  {id: '10', component: Scene10Close},
];

const durationMap = durations as Record<string, number>;

// Deliberate silence after a scene's narration, requested per-scene by the script
// (the judge asked for holds on the two "lean in" beats). Frames of stillness,
// not dead air: the scene keeps drifting, it just stops talking.
const holdMap: Record<string, number> = Object.fromEntries(
  (narration as {id: string; hold_seconds?: number}[]).map((s) => [
    s.id,
    s.hold_seconds ?? 0,
  ])
);

export type TimelineEntry = SceneDef & {
  from: number; // first frame of this scene
  durationInFrames: number;
  audioDurationInFrames: number; // narration length without padding
};

export const getTimeline = (): TimelineEntry[] => {
  let cursor = 0;
  return scenes.map((scene) => {
    const seconds = durationMap[scene.id] ?? FALLBACK_SECONDS;
    const audioFrames = Math.round(seconds * FPS);
    const holdFrames = Math.round((holdMap[scene.id] ?? 0) * FPS);
    const durationInFrames = audioFrames + holdFrames + SCENE_PADDING_FRAMES;
    const entry: TimelineEntry = {
      ...scene,
      from: cursor,
      durationInFrames,
      audioDurationInFrames: audioFrames,
    };
    cursor += durationInFrames;
    return entry;
  });
};

export const getTotalDurationInFrames = (): number =>
  getTimeline().reduce((sum, s) => sum + s.durationInFrames, 0);
