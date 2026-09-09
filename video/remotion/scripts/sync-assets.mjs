// Copies shared workspace assets into the Remotion project.
//   video/audio/*.wav           -> remotion/public/audio/
//   video/audio/durations.json  -> remotion/src/data/durations.json (importable)
//   video/script/narration.json -> remotion/src/data/narration.json (hold_seconds)
//   video/assets/* (images)     -> remotion/public/assets/
// Run from remotion/: `npm run sync-assets`. Re-run whenever audio or screenshots change.
import {cpSync, existsSync, mkdirSync, readdirSync, copyFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const remotionRoot = resolve(here, '..');
const videoRoot = resolve(remotionRoot, '..');

const audioSrc = join(videoRoot, 'audio');
const assetsSrc = join(videoRoot, 'assets');
const audioDst = join(remotionRoot, 'public', 'audio');
const assetsDst = join(remotionRoot, 'public', 'assets');
const durationsDst = join(remotionRoot, 'src', 'data', 'durations.json');
const narrationSrc = join(videoRoot, 'script', 'narration.json');
const narrationDst = join(remotionRoot, 'src', 'data', 'narration.json');

mkdirSync(audioDst, {recursive: true});
mkdirSync(assetsDst, {recursive: true});

let copied = 0;

if (existsSync(audioSrc)) {
  for (const f of readdirSync(audioSrc)) {
    if (f.endsWith('.wav')) {
      copyFileSync(join(audioSrc, f), join(audioDst, f));
      copied++;
    }
  }
  const durations = join(audioSrc, 'durations.json');
  if (existsSync(durations)) {
    copyFileSync(durations, durationsDst);
    copied++;
    console.log('synced durations.json -> src/data/durations.json');
  } else {
    console.warn('WARNING: audio/durations.json not found — timeline will use fallbacks');
  }
} else {
  console.warn('WARNING: video/audio/ does not exist yet (sound agent not done?)');
}

if (existsSync(narrationSrc)) {
  copyFileSync(narrationSrc, narrationDst);
  copied++;
  console.log('synced narration.json -> src/data/narration.json');
} else {
  console.warn('WARNING: script/narration.json not found — holds will default to 0');
}

if (existsSync(assetsSrc)) {
  cpSync(assetsSrc, assetsDst, {
    recursive: true,
    filter: (src) => !src.endsWith('.md'),
  });
  copied++;
} else {
  console.warn('WARNING: video/assets/ does not exist yet (editor not done?)');
}

console.log(copied > 0 ? 'sync-assets: done' : 'sync-assets: nothing to copy yet');
