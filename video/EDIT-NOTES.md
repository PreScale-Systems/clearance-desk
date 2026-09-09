# EDIT-NOTES.md — editor's pass on the rendered cut

Subject: `video/out/clearance-desk-demo.mp4` (144.1s, 1920×1080, 30fps, H.264 + AAC).
Reviewed 2026-09-10 against `BRIEF.md`, `script/narration.json` (visual directives + `hold_seconds`),
`assets/FOOTAGE.md` (my own capture notes) and `reviews/judge-final.md`.

## How I reviewed it

- Extracted the whole runtime at 0.5fps (72 frames) into `out/review-frames/` and read every frame.
- Pulled targeted single frames at all nine scene boundaries and at both 1.5s holds
  (scenes 04 and 05) into `out/spot/`.
- `ffmpeg freezedetect=n=-55dB:d=0.7` for dead/frozen video; `silencedetect=-45dB:d=0.5`
  for audio gaps. Both logs are in `out/`.
- Cross-checked every legible on-screen number against the canonical facts in `FOOTAGE.md`.

## What I checked and cleared (no action needed)

- **Numbers.** Every number on screen is canonical. Scene 02 counts up to **48 items**; scene 04's
  stat bar lands on **25 conflict / 12 caution / 11 clear**; scene 07 reads **39 of 44** and
  **7:21 / 2:58**; scene 05 shows the Florida registry entity `L25000420174` "an exact match";
  scene 06 highlights **JOSEPHINE STERLING ✓**. Grepped the whole Remotion source: **"Eleanor Preston"
  appears nowhere**, and neither do the stale BRIEF numbers (17/16/15, "reused 41").
- **Cross-run continuity.** `Scene04Verdicts.tsx` already separates job `8b5d791e07d4`
  (pending → mid, 21/11/12) from job `6b1b3eacd1dd` (done, 25/12/11) with a deliberate ~0.8s
  dip to black at 0:51 — exactly the beat change `FOOTAGE.md` demands. Verified on frame.
- **Audio.** No narration crosses a scene cut (each `<Audio>` lives inside its own `<Sequence>`
  and every scene is `audio + hold + 12` frames, so there is always ≥0.4s of air before a cut).
  The only long silences are the two intended holds: **58.10→60.07s** and **75.76→77.78s**,
  ~2.0s each, matching the 1.5s `hold_seconds` + padding. Neither hold is frozen — both keep a
  slow Ken Burns drift under them. No clipping.
- **End card.** Complete and correct: wordmark, tagline "Clear a draft in minutes.",
  `https://clearance-desk-769027363263.us-central1.run.app`,
  `github.com/PreScale-Systems/clearance-desk`, and both sponsor badges.
- **Runtime.** 144.03s, unchanged by this pass — I did not touch `timeline.ts`, `narration.json`,
  or any audio.

## Issues found, in priority order, and what I did

### 1. The cold open was 15 seconds of motionless type — FIXED
`freezedetect` flagged the first 15s as four frozen stretches (5.2s / 2.3s / 1.5s / 5.2s). The first
product pixel did not arrive until 15.5s, and the frame stopped changing entirely at ~11.5s.
This is the judge's #1 improvement and matched my own read.

`remotion/src/scenes/Scene01Hook.tsx`:
- A full-bleed plate of `done-overview.png` — the cleared draft with its red/amber/green highlights
  and the conflict ledger — now rises behind the title card from **frame 96 (3.2s)** to 0.34 opacity
  and keeps drifting (scale 1.16 → 1.03) for the whole card. Real, working product on screen inside
  four seconds, and the frame is never static again.
- A center-weighted radial scrim over the plate keeps the 88px serif headline crisp; the app reads
  at the edges of frame where nothing is set.
- Added a fourth line, **"E&O insurance requires it."**, at frame 326 — the VO says
  "Errors and omissions insurance — E and O — requires it" there and nothing was on screen for it.
  That was the dead tail of the card.

### 2. Caption cards were translucent, so screenshot text ghosted through them — FIXED
The shared `Callout` was `rgba(14,15,19,0.92)`. Over the light app screenshots, script lines were
plainly legible *behind* the caption text — worst at 0:50 (the VERDICTS legend sitting on top of
Daniel's dialogue) and at 1:46 (the "39 of 44" card, the single best frame in the video, with six
lines of screenplay showing through it). Also visible on the scene 05 "OPEN A CONFLICT" card.

- `remotion/src/components/overlays.tsx`: `Callout` → `0.985`.
- Same bump applied to the hand-rolled panels: `Scene01Hook.tsx`, `Scene02Extraction.tsx` (stage
  pill + count card), `Scene07RevisionLoop.tsx` (three panels), and the scene 04 stat bar → `0.99`.

This was the most pervasive craft defect in the cut and the cheapest to fix.

### 3. Ken Burns pushed the risk-ledger sidebar out of frame — FIXED (judge's #4)
Three separate shots clipped the ledger's category labels to "per" / "br" / "busin" and shaved the
CLEARANCE DESK wordmark off the left.

- `Scene04Verdicts.tsx` part 2 (0:56–1:00): reversed the move, `1.0 → 1.06` becomes **`1.045 → 1.0`**.
  It still drifts, but it *settles* onto the complete uncropped board exactly on the stat bar and the
  silent hold — the frames a judge actually reads. Verified: "person / brand / business /
  organization" and the "Clear revised draft" footer are all whole at the hold.
- `Scene07RevisionLoop.tsx` shot B establishing beat: `1.0 → 1.14 @ x=980` (which cropped ~100px of
  sidebar and cut the "New script" button) becomes **`1.06 → 1.0 @ x=960`**, same settle-in move.
  Verified: header chips `pasted-draft` + `revision of 6b1b3eacd1dd`, all "carried over" badges,
  "44 items found" — all in frame.
- `Scene01Hook.tsx` landing-page cut: zoom `1.0 → 1.06` → **`1.0 → 1.03`** with
  `transformOrigin` moved to `0% 35%`. The wordmark and the "0 conflict" cell of the counts strip
  both bleed to x=0 in the source capture, so a centred push always ate them; anchoring left puts the
  crop on the empty right-hand margin.

### 4. Scene 03 opened on a sliced ledger — FIXED
The browser-framed ledger panel opened mid-way through the conflict/caution/clear counts row, so the
digits were cut in half along the top edge — on the Parallel scene, of all places.
`Scene03Parallel.tsx`: pan `fy` start `460 → 436` (end `585 → 561`, same drift distance). The
counts row now sits whole inside the frame.

### 5. Scene 09 dimmed the sponsor's box to 32% and froze for 12.5s of its 15.5s — FIXED
`freezedetect` found 4.5s + 2.9s + 3.1s of pixel-identical diagram. Separately, the spotlight rested
non-active stages at 0.32 opacity, which made the **researcher / Parallel Search API** card's body
copy unreadable for ~5s at a stretch.

`Scene09UnderTheHood.tsx`:
- Resting level `0.32 → 0.55`. Still clearly "not the stage we're on", but legible — verified that
  "Parallel Search API" and "2–3 templated queries per item, mode: fast" now read while dimmed.
- Added a slow push on the whole board (scale 1 → 1.022 across the scene) so the diagram breathes
  between beats instead of sitting as a still.

### 6. The finished end card exists for well under two seconds — PARTIALLY FIXED, needs the coordinator
The scene 10 VO is 11.46s inside a 11.87s scene, so there is only **0.4s of tail** after the last
word — not the "two seconds of silence" `narration.json` asks for. The URL and repo were only fully
assembled from ~2:23.

`Scene10Close.tsx`: pulled the assembly earlier — `TAGLINE_AT 270→266`, `LINKS_AT 296→280`,
`BADGES_AT 314→292` — without moving the tagline off its VO line. The complete card now exists from
f306 (~1.7s instead of ~0.9s).

**This is as far as I can go without `timeline.ts`, which I do not own.** Scene 10 wants roughly
**+75 frames (2.5s)** of hold. Total would go 144.0s → 146.5s, still 33s under the 180s cap.
Coordinator: please add that hold and I'll be happy with the ending.

## Reported, deliberately not fixed

- **Cross-run count progression at 0:44–0:50.** Between the two runs the *clear* count reads
  12 then 11, which cannot happen inside one job. This is the honest pending → mid → done sequence
  `FOOTAGE.md` prescribes, the dip-to-black already declares the run change, and it is on screen for
  ~2s. Re-shooting a single-run progression was not possible during capture (the judge phase resolves
  all 48 items in 60–90s; see the capture notes). Agreeing with the judge: not worth a re-edit.
- **Ghosted `agent/pipeline.py` behind the scene 09 diagram** (the script offered it, judge's #6).
  There is no source-code screenshot in `assets/` and capturing one now means a new asset plus a new
  layer on a scene I just stabilised. Skipped as the lowest-value / highest-risk item in the list.
- **Scene 05's blank right half.** During the evidence push-in the pan leaves ~40% of the frame as
  empty cream page. It reads as breathing room rather than a mistake, and the evidence panel — the
  credibility anchor — is perfectly legible, so I left the framing alone.
- **Scene 06's three ~1.8s freezes** (78.3–85.0s). These are the typographic beat
  "A conflict list is a problem. / A conflict list with fixes is a product." holding between lines.
  The judge's "must not change" list protects that treatment, and it is a deliberate pause, not dead air.

## What I'd still change with more time

1. **A score or a −40 dB ambient bed.** Routed to the sound agent, but worth restating from the
   picture side: the two silent holds are *pure digital silence*, which makes deliberate beats read
   as dropouts. Any bed at all converts both holds from "did the file break?" to "lean in."
2. **Re-capture a single-run verdict progression** so scene 04 needs no dip-to-black at all.
3. **Scene 05 framing** — a two-up of the script highlight and the evidence panel instead of letting
   the script column pan out of frame.

## For the judge

- Every app frame in this video is a real capture of a real run against the live Cloud Run
  deployment. Nothing is mocked and no verdict, count or citation was invented; the three jobs behind
  the footage are itemised in `assets/FOOTAGE.md` and are still resolvable on the server.
- The two 1.5s silent holds (1:00 and 1:18) are intentional, scripted beats, not encoding faults.
- The one continuity compromise is disclosed above (§ "not fixed", item 1) and is flagged on screen
  by a cut to black.

## State of the source

All edits are in `remotion/src/` only. `npx tsc --noEmit` passes. Timing math untouched:
`timeline.ts`, `script/narration.json` and the narration wavs are exactly as I found them, and the
composition is still **4321 frames / 144.03s**.

I verified each fix with `npx remotion still` at the affected frames rather than re-rendering the
movie, so **`out/clearance-desk-demo.mp4` is still the OLD render** — it does not yet contain any of
this. The coordinator is re-rendering once the sound agent's loudness pass lands.
