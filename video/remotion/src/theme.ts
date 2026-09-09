// Design system tokens — every scene must use these. See ../../REMOTION-GUIDE.md
import {loadFont as loadSerif} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

// Load only the weights/subsets we use — keeps render-time font fetches small.
const serif = loadSerif('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
const sans = loadSans('normal', {weights: ['400', '500', '600'], subsets: ['latin']});

export const theme = {
  colors: {
    bg: '#0e0f13', // near-black background
    text: '#f4f1ea', // off-white text
    textDim: 'rgba(244, 241, 234, 0.55)', // secondary labels
    clear: '#34d399', // green — verdict: clear
    caution: '#fbbf24', // amber — verdict: caution
    conflict: '#f87171', // red — verdict: conflict
    hairline: 'rgba(244, 241, 234, 0.12)', // borders / rules
    chrome: '#1a1c22', // browser-chrome frame fill
  },
  fonts: {
    // Serif display for headlines (legal-memo feel)
    serif: `${serif.fontFamily}, Georgia, serif`,
    // Clean sans for UI labels, captions, stats
    sans: `${sans.fontFamily}, Helvetica, Arial, sans-serif`,
    // System monospace for query strings / URLs (no network fetch needed)
    mono: `'SF Mono', Menlo, Consolas, 'Courier New', monospace`,
  },
  // Generous whitespace: outer page margin at 1920x1080
  margin: 120,
} as const;

export type Verdict = 'clear' | 'caution' | 'conflict';
