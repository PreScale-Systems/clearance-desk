# REMOTION-GUIDE.md — for the Remotion developer

Scaffold is done, installed, and render-verified (Remotion **4.0.523**, React 19.3, TS 5.9,
Node 24). All snippets below are tested against this install. Work inside
`video/remotion/`. Composition id is **`Demo`**, 1920×1080 @ 30fps.

## Project layout

```
video/remotion/
├── remotion.config.ts        # jpeg frames, overwrite output
├── scripts/sync-assets.mjs   # copies audio + screenshots in (see below)
├── public/                   # staticFile() root
│   ├── audio/                # scene-<id>.wav (synced, gitignored)
│   └── assets/               # screenshots (synced, gitignored)
└── src/
    ├── index.ts              # registerRoot — don't touch
    ├── Root.tsx              # <Composition id="Demo"> — duration auto-computed
    ├── Demo.tsx              # lays scenes out with <Sequence> + per-scene <Audio>
    ├── timeline.ts           # ★ scene order + timing. You edit `scenes` here.
    ├── theme.ts              # ★ design tokens + fonts. Use these everywhere.
    ├── data/durations.json   # synced copy of audio/durations.json
    └── scenes/               # ★ one file per scene goes here (TestCard.tsx is the example)
```

Your workflow: write one component per scene in `src/scenes/`, register each in the
`scenes` array in `src/timeline.ts` (in narration order, ids matching
`script/narration.json`), flip `HAS_AUDIO` to `true` in `Demo.tsx`. Everything else
(durations, offsets, total length, audio embedding) is already wired.

## Assets: run sync first

Wavs live at `video/audio/scene-<id>.wav` and screenshots at `video/assets/` — outside
the Remotion project, so the bundler can't see them. **Decision: they are copied into
`remotion/public/`** (Remotion's `staticFile()` root; symlinks are not reliable across
the bundler). Also copies `audio/durations.json` → `src/data/durations.json` so it's a
typed static import.

```bash
cd video/remotion
npm run sync-assets   # re-run whenever the sound agent or editor updates files
```

It warns (doesn't fail) if sources don't exist yet. Synced copies are gitignored.

## Timing: durations.json drives everything

`src/timeline.ts` is the single source of truth. Per scene:
`frames = round(durations[id] * 30) + SCENE_PADDING_FRAMES` (12 frames = 0.4s of air).
Scenes with no entry fall back to 2s — that's for pre-audio dev only; a real render
must have real durations. `Root.tsx` computes total length via `calculateMetadata`:

```tsx
<Composition
  id="Demo" component={Demo} width={1920} height={1080} fps={FPS}
  durationInFrames={getTotalDurationInFrames()}
  calculateMetadata={() => ({durationInFrames: getTotalDurationInFrames()})}
/>
```

**Never hardcode a scene duration.** If pacing feels off, adjust
`SCENE_PADDING_FRAMES` (global) or ask the sound agent for a re-cut, and note it in
`EDIT-NOTES.md`.

## Scene layout with `<Sequence>` (already wired in Demo.tsx)

```tsx
{getTimeline().map((scene) => (
  <Sequence key={scene.id} from={scene.from}
            durationInFrames={scene.durationInFrames} name={scene.id}>
    <scene.component />
    <Audio src={staticFile(`audio/scene-${scene.id}.wav`)} />
  </Sequence>
))}
```

Inside a `<Sequence>`, `useCurrentFrame()` is local (starts at 0) — write every scene
as if it begins at frame 0. `useVideoConfig().durationInFrames` inside a Sequence is
the scene's own length, handy for exit animations. Each scene entry also carries
`audioDurationInFrames` (narration length without padding) if you want visuals to
settle exactly when the VO ends.

## Audio

`<Audio src={staticFile('audio/scene-hook.wav')} />` inside the scene's Sequence —
it starts and stops with the Sequence automatically. `Demo.tsx` has a `HAS_AUDIO`
flag (currently `false` because no wavs exist yet): **set it to `true` after
sync-assets**, otherwise the render fails on missing files. Options if needed:
`volume={1}`, `trimBefore/trimAfter` (frames) — you shouldn't need trims since
durations are measured from the files.

## Screenshots

Editor's manifest is `video/assets/FOOTAGE.md`. After sync they're at
`public/assets/`, so:

```tsx
import {Img, staticFile} from 'remotion';
<Img src={staticFile('assets/report-overview.png')} style={{width: '100%'}} />
```

Use `<Img>` (not `<img>`) — Remotion waits for it to decode before capturing the
frame, so no flicker. Per the design system, frame every screenshot in browser
chrome — build one reusable `src/scenes/BrowserFrame.tsx` like:

```tsx
import React from 'react';
import {theme} from '../theme';

export const BrowserFrame: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{
    backgroundColor: theme.colors.chrome, borderRadius: 16, overflow: 'hidden',
    border: `1px solid ${theme.colors.hairline}`,
    boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
  }}>
    <div style={{display: 'flex', gap: 8, padding: '14px 18px'}}>
      {['#f87171', '#fbbf24', '#34d399'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: 6, backgroundColor: c}} />
      ))}
    </div>
    {children}
  </div>
);
```

## Animation: interpolate + spring

Always clamp, always drive from `useCurrentFrame()`. Verified patterns:

```tsx
const frame = useCurrentFrame();
const {fps, durationInFrames} = useVideoConfig();

// Fade in over 20 frames
const opacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});

// Slide up 40px with a soft spring (damping 200 = no bounce, editorial feel)
const s = spring({frame, fps, config: {damping: 200}});
const y = interpolate(s, [0, 1], [40, 0]);

// Scale-in (use sparingly — screenshots landing on screen)
const scale = interpolate(spring({frame, fps, config: {damping: 18, mass: 0.6}}), [0, 1], [0.94, 1]);

// Fade out at the end of the scene
const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
  extrapolateLeft: 'clamp',
});

<div style={{opacity: opacity * out, transform: `translateY(${y}px) scale(${scale})`}} />
```

Stagger list items (verdict rows etc.) by offsetting frame per index:
`spring({frame: frame - i * 4, fps, ...})` — negative frames are fine, spring stays at 0.

`src/scenes/TestCard.tsx` is a working example using all of this + the theme.

## Transitions (@remotion/transitions is installed)

Cross-scene transitions require `<TransitionSeries>` instead of raw Sequences. Note:
transitions **overlap** scenes, shortening total length by each transition's duration
— if you use it, subtract transition durations in the timeline math or the audio will
drift. Recommendation for this video: keep the plain-Sequence layout (hard cuts on
black feel editorial and keep audio math trivial) and do fades *within* scenes. If
you do want it:

```tsx
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={a}>...</TransitionSeries.Sequence>
  <TransitionSeries.Transition timing={linearTiming({durationInFrames: 10})} presentation={fade()} />
  <TransitionSeries.Sequence durationInFrames={b}>...</TransitionSeries.Sequence>
</TransitionSeries>
```

(Also available: `slide`, `wipe`, `clockWipe`, `flip` — don't; fade only fits the look.)

## Design system (mandatory)

All tokens live in `src/theme.ts` — import `theme`, never hardcode colors/fonts.

- Background `#0e0f13` (near-black), text `#f4f1ea` (off-white), dim text via
  `theme.colors.textDim`, hairline borders via `theme.colors.hairline`.
- One accent per verdict, used only for verdicts: **clear `#34d399`**,
  **caution `#fbbf24`**, **conflict `#f87171`**.
- Type: `theme.fonts.serif` (Playfair Display — headlines, the legal-memo voice) and
  `theme.fonts.sans` (Inter — UI labels, captions, stats). Loaded via
  `@remotion/google-fonts` in theme.ts with pinned weights (serif 400/600/700, sans
  400/500/600) — if you need another weight, add it there, nowhere else. Font loading
  fetches from Google at render time, so renders need network.
- Generous whitespace: `theme.margin` (120px) page padding; let headlines breathe.
- Screenshots always inside the rounded browser chrome with shadow (see BrowserFrame).

## Preview & render

```bash
cd video/remotion
npm run sync-assets
npx remotion studio                 # preview at http://localhost:3000
npx remotion render Demo ../out/test.mp4 --codec=h264        # quick check
npm run render                      # final:
#  = npx remotion render Demo ../out/clearance-desk-demo.mp4 \
#      --codec=h264 --crf=18 --pixel-format=yuv420p
```

H.264 + CRF 18 + yuv420p gives high-quality, universally playable 1080p30 (audio is
muxed as AAC automatically). Verified output of the test render: h264 High,
1920×1080, 30fps. Type-check with `npx tsc --noEmit` before rendering.

## Gotchas found during scaffold

- A shell guard in this environment blocks output redirection (`>`, `2>&1`) to paths
  outside the repo, `/dev/null` included. Redirect only to files inside the project,
  or don't redirect.
- Render/studio commands must run from `video/remotion/` (that's where the config and
  entry point resolve).
- `HAS_AUDIO` in `Demo.tsx` must be flipped to `true` once wavs are synced — a
  missing wav referenced by `<Audio>` fails the render.
- `durations.json` keys must exactly match the `id`s in `timeline.ts`'s `scenes`
  array and the `scene-<id>.wav` filenames.
