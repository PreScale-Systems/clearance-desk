# Sound notes — voiceover pipeline (pocket-tts)

## Chosen voice: `alba`

Kyutai Pocket TTS (v3.1.0), default English model (`english` = `english_2026-04`),
predefined voice **alba** — Kyutai's flagship natural voice. Warm, confident,
clearly articulated, non-robotic; the best product-demo narrator of the six
candidates auditioned (alba, marius, javert, jane, michael, eve). marius was
rushed (3.5 w/s), javert too slow/deliberate (2.3 w/s); the VCTK voices
(jane/michael/eve) are flatter.

## Files (what Remotion should use)

| path | what it is |
|---|---|
| `audio/scene-<id>.wav` | **delivery clips** — loudness-normalized, 24 kHz mono 16-bit |
| `audio/durations.json` | scene lengths measured from the delivery clips |
| `audio/bed.wav` | ambient bed, 170 s, 24 kHz stereo (see below) |
| `audio/raw/scene-<id>.wav` | untouched TTS output + `.txt` synthesis cache — inputs, not deliverables |

## Measured speaking rate

- Test line (12 words): 4.04 s → **2.97 words/sec**
- Full script (370 words, final): 137.0 s → **2.70 words/sec** (use this for
  planning; longer sentences + end-of-clip padding slow the average)

## FINAL VO (continuity-pass script, 2026-09-10 — Remotion builds against this)

| scene | words | seconds |
|---|---|---|
| 01 The Problem and the Money | 50 | 16.96 |
| 02 Upload and Extraction | 32 | 14.32 |
| 03 Live Research via Parallel | 35 | 11.04 |
| 04 Verdicts Land | 34 | 14.56 |
| 05 Anatomy of a Conflict | 44 | 15.84 |
| 06 Verified Replacements | 42 | 14.72 |
| 07 The Revision Loop | 39 | 13.52 |
| 08 The Exportable Report | 26 | 9.44 |
| 09 Under the Hood | 39 | 15.12 |
| 10 The Close | 29 | 11.46 |
| **Total** | **370** | **137.0** |

Continuity pass regenerated only scenes 04, 06, 07 (sidecar cache); all ten
sidecars verified against the current narration.json — no stale audio.
Transcription check on the changed scenes confirms the corrected numbers
("25 conflict, 12 caution, 11 clear"; "39 of 44"; "under three minutes, not
seven") and "Josephine Sterling" is pronounced cleanly (word confidences
0.99 / 0.82) — no TTS substitution needed.

## Loudness normalization (judge-final improvement #2)

The render measured **-19.8 LUFS** integrated — about 6 LU under the platform
norm. YouTube attenuates loud uploads but never boosts quiet ones, so the video
would have played audibly softer than competing submissions.

| | integrated | true peak | LRA |
|---|---|---|---|
| before (raw VO concat) | **-19.7 LUFS** | -1.3 dBTP | 3.1 LU |
| after (delivery clips) | **-14.0 LUFS** | **-1.2 dBTP** | 2.6 LU |

Method — measured once across the concatenation of **all** scenes, then applied
to each scene as **one uniform gain**, never per-file normalization (that would
have flattened the intentional scene-to-scene dynamics):

```
volume=+8.0dB, alimiter=limit=-2.5dB:attack=5:release=60:level=disabled
```

The gain is larger than the 5.7 dB the measurement implies because the limiter
gives some of it back; +8.0 dB into a -2.5 dBFS sample-peak ceiling lands exactly
on -14.0 LUFS while keeping true peak at -1.2 dBTP (the ceiling sits 1.5 dB below
the true-peak target to absorb inter-sample peaks). Alternatives were tried and
rejected: a compressor stage ahead of the limiter measured worse at every setting,
and a higher ceiling (-2.0 dB) pushed true peak to -0.8 dBTP, over budget. The
limiter only touches rare transients — LRA moves 3.1 → 2.6 LU, so the delivery is
not squashed.

**Durations are unchanged.** `volume` and `alimiter` are both sample-for-sample
duration-preserving; `make_vo.py` now asserts this on every run, comparing each
normalized clip against both its raw source and the previous `durations.json`,
and prints a loud warning if any value moves. `timeline.ts` needs no changes.

This is wired into the pipeline, not a one-off: `make_vo.py` synthesizes into
`audio/raw/` (cached, because synthesis is non-deterministic and a re-run must
never silently change approved audio) and then always re-derives the delivery
clips in `audio/` from raw with the same constants. Re-running is safe and
idempotent — gain is never applied twice. If the VO is ever re-synthesized,
re-derive the gain with:

```sh
.tts-venv/bin/python scripts/make_vo.py --remeasure
```

## Ambient bed — `audio/bed.wav`

The judge found the gaps were **pure digital silence** (`astats` reported a -inf
noise floor), which made the two deliberate 1.5 s holds read as dropouts rather
than beats. `audio/bed.wav` gives the piece a floor:

- **170 s**, 24 kHz stereo 16-bit, **-54.0 LUFS** integrated (peak -38.2 dBFS) —
  ~40 dB under the -14 LUFS narration, i.e. near-subliminal.
- 170 s covers the ~150 s render with head/tail slack, including the longer end
  card. 24 kHz because no layer carries energy above 1.5 kHz (48 kHz would only
  double the file size) and it matches the narration clips.
- **100% procedural — zero copyright risk.** Nothing was downloaded; it is
  built entirely from ffmpeg `anoisesrc` and `sine` sources.

Three layers, each with its own very slow amplitude LFO on a mutually prime
period (29 s / 41 s / 53 s) so they drift in and out of phase — the timbre keeps
moving but no rhythm ever emerges to fight the narration:

- **air** — brown noise band-limited to 280–1500 Hz, independent seeds per
  channel for a wide, decorrelated stereo image
- **deep** — brown noise under 320 Hz, mono (bass stays centered)
- **drone** — 55 Hz + 82.5 Hz sines (a fifth) under a 200 Hz lowpass

Verified: 5-second-window RMS drifts smoothly between -63 and -54 dBFS with no
repeating short pattern; channels balance within 0.2 dB. Mixed under the VO
timeline the result measures **-14.1 LUFS** (the bed costs 0.1 LU) and the noise
floor becomes **-62 / -57 dB instead of -inf** — the holds now read as beats.

Regenerate (two-pass: build at unity, measure, re-render at the exact gain):

```sh
python3 scripts/make_bed.py                      # defaults: 170 s, -54 LUFS
python3 scripts/make_bed.py --seconds 200 --lufs -52   # longer / slightly louder
```

Needs only ffmpeg — no venv, no model. If the bed ever feels audible, raise the
`--lufs` number toward -50 for more presence or toward -58 for less.

## Notes for the Remotion developer

Total VO comfortably under the 170 s budget.

- `hold_seconds` (scenes 04 and 05, 1.5 s each) are **NOT** baked into the
  wavs — the wavs and `durations.json` are pure VO length. Add the holds in
  the composition.
- Scene 10's `tts_note` 0.5 s beat after "until now." **is** inside
  scene-10.wav (it is part of the VO delivery, not a hold): the closing line is
  synthesized as two takes joined with 0.5 s of silence, handled by
  `SCENE_SPLITS` in make_vo.py — narration.json was not modified.
- Clips start with speech almost immediately (no leading silence); a couple of
  frames of audio fade-in per scene is a nice safety.
- **Bed**: lay `audio/bed.wav` under the whole comp at unity — it is already at
  its final level, so no extra gain or ducking is needed. Start it at frame 0 and
  let it run under everything including the end card; it is 170 s, longer than
  the render, so trim the tail rather than looping (a loop seam would be the one
  audible thing in it). The scene wavs are mono, the bed is stereo.
- Mixed together the timeline measures -14.1 LUFS / -1.2 dBTP — already at the
  platform norm, so the final render needs no further audio processing.

## Pronunciation check (judge's request)

Spot-checked by transcribing the generated wavs with faster-whisper
(small.en, word-level confidences) — installed in the same venv:

- "Northstar" → heard as "North Star Consulting Group": correct two-word
  pronunciation, no fix needed.
- "Caroline Mercer" → transcribed exactly, p≈0.98.
- "Josephine Sterling" (final continuity pass) → transcribed exactly,
  p = 0.99 / 0.82. (The earlier "Eleanor Preston" cut was also clean.)
- "E and O" → comes out as spoken letters ("E &O" in the transcript), correct.
- Scene 10 beat verified in word timestamps: "now." ends 7.96 s, "Clearance"
  starts 8.76 s.

No TTS input substitutions were needed; the `TTS_SUBSTITUTIONS` dict in
make_vo.py is the place to add one if a future line needs it (TTS input only —
never edit narration.json). Re-check after any script change:

```sh
.tts-venv/bin/python <scratch>/check_pron.py audio/scene-XX.wav
```
(uses faster-whisper; any transcription script works)

## How to (re)generate

```sh
cd video
.tts-venv/bin/python scripts/make_vo.py            # voice defaults to alba
.tts-venv/bin/python scripts/make_vo.py --force    # re-synthesize everything
.tts-venv/bin/python scripts/make_vo.py --remeasure # re-derive the loudness gain
.tts-venv/bin/python scripts/make_vo.py --voice michael   # try another voice
python3 scripts/make_bed.py                        # rebuild the ambient bed
```

`make_vo.py` reads `script/narration.json` and runs two stages: **synthesis**
into `audio/raw/` (cached — a `.txt` sidecar per scene holds voice + text +
beat, so only missing or changed scenes are re-synthesized) and **loudness
normalization** from `audio/raw/` into `audio/` (always rerun, deterministic,
duration-preserving). `audio/durations.json` is re-measured from the delivery
clips every run and checked against the previous values. Synthesis runtime is
~40 s for all 10 scenes on CPU; normalization is ~1 s.

Do not hand-edit files in `audio/` — they are derived. Edit the constants at the
top of `make_vo.py` instead.

## pocket-tts facts & quirks

- **Install**: `pip install pocket-tts` 401s against a stale private
  CodeArtifact index configured on this machine — pass
  `--index-url https://pypi.org/simple` (the remaining 401 warnings are
  harmless). Venv lives at `video/.tts-venv` (Python 3.14 works).
- **Output format**: 24 kHz, mono, 16-bit PCM wav. Tell the Remotion dev —
  Remotion `<Audio>` handles this fine, no resampling needed.
- **CLI**: `pocket-tts generate -q --text "..." --voice alba --output-path out.wav`
- **Python API** (what make_vo.py uses — loads the model once for all scenes):
  `TTSModel.load_model()` → `model.get_state_for_audio_prompt("alba")` →
  `model.generate_audio(state, text, copy_state=True)` → tensor
  [channels, samples] at `model.sample_rate`.
- **Predefined voices** (English model): cosette, marius, javert, alba, jean,
  anna, vera, fantine, charles, paul, eponine, azelma, george, mary, jane,
  michael, eve, bill_boerst, peter_yearsley, stuart_bell, caro_davy. `--voice`
  also accepts any wav path/URL for cloning.
- **Text length**: no practical per-call limit — generation is chunked
  internally (`--max-tokens`, default 50 tokens/chunk); a full 50-word scene in
  one call is fine and sounds continuous. Keep one call per scene.
- **Punctuation**: the model auto-formats capitalization/punctuation. Em dashes
  and colons produce natural pauses. Spell out anything you want read literally
  ("E and O", numbers as words — the script already does this). Avoid symbols
  like `→`, `$`, `&` in narration text.
- Model weights download from Hugging Face on first run and are cached in
  `~/.cache/huggingface` (small; first call cost only).
- Each clip ends with a few frames of silence after EOS (~0.2–0.5 s), so
  durations.json already includes a little natural breathing room.

## Incident log (for the record)

The spike's temporary 2-scene test `narration.json` briefly overwrote the
script writer's real file (delivered mid-spike). It was reconstructed
verbatim from `script/SCRIPT.md` (same author, canonical VO text) and the full
VO was generated from the reconstruction. If the script writer keeps a copy,
diff it against `script/narration.json` — the narration strings must match
SCRIPT.md exactly, and any change will be picked up by re-running make_vo.py.
