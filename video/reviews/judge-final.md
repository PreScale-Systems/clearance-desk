# Judge review — rendered video

Reviewed: 2026-09-10. Subject: `video/out/clearance-desk-demo.mp4` (144.1s, 1920×1080, 30fps, AAC stereo).
Method: frame extraction at 0.5fps across the whole runtime, 1fps across the hook and the end card,
targeted single-frame pulls on every beat, read alongside `script/narration.json`. Audio measured with
`ebur128` / `astats`. Every on-screen number cross-checked against `assets/FOOTAGE.md`.

## Verdict: SHIP

No blocking issues. Nothing on screen overclaims, nothing contradicts the canonical run facts, and the
product reads as unmistakably real and working. This is a top-quartile Devpost video and, on
sponsor-integration depth, probably the strongest thing in a Parallel-track field. The two fixes below are
polish, not repairs — but the first one is worth doing, because it is the difference between a judge
watching attentively and a judge scrubbing.

Runtime discipline is a real asset: 144s against a 180s ceiling. It never overstays.

## Scores

| Criterion | Score /10 | Notes |
|---|---|---|
| Hook (first 15s) | **7** | The *information* lands: by 0:13 a judge has heard mandatory, $1k–5k, 1–3 weeks, restarts every rewrite, and has seen sponsor badges from second 3. But the first product pixel does not arrive until **15.5s**. It is 15 seconds of one static text card — and it stops changing entirely at ~11.5s, so the last four seconds are dead. On a judging queue this reads as a slide deck, not a demo. |
| Sponsor-tech centrality | **9** | Parallel is structural, not garnish. On screen seven separate times: title-card badge (0:03), the app's own "Research" column (0:20), the full fan-out scene with `mode: fast` and "The same queries. Every run." (0:32–0:42), the literal `searched:` query strings inside the evidence panel (0:76), "searched again via Parallel → judged again → verified" on the replacement beat (0:88), the architecture diagram (2:00), and the end card. The determinism thread makes Parallel the *reason* the revision loop works — that is what separates real integration from a logo. Short of 10 only because a raw API response or SDK call is never glimpsed. |
| Demo clarity | **9** | One continuous story through a real app, and every legible number is canonical: 48 items, 25/12/11, 39 of 44, 7:21 vs 2:58, JOSEPHINE STERLING ✓, the Florida registry exact match with entity number. The screenplay-with-live-highlights device makes an abstract product instantly legible. |
| Wow beat | **8** | Two, and both land. The evidence push-in at 1:14 (Florida corporate registry, `L25000420174`, "an exact match") is the credibility anchor and is correctly held in silence. The engineering wow is the 1:45 card — "39 of 44 verdicts reused" over a two-bar 7:21 / 2:58 comparison. That is the single best frame in the video. Neither beat gets any audio lift to sell it. |
| Ending | **8** | The mandate mirror-close works, "Nobody has automated it" is the right last idea, and the end card is complete — wordmark, tagline, live Cloud Run URL, repo, both sponsor badges. Docked because the fully-assembled card exists for only ~1.5s before the file ends, and it dies into absolute digital silence. |
| Production polish | **7** | The type, grade, and callout system are genuinely handsome and well above hackathon average — the dark-card-over-light-app language is consistent throughout. Dragged down entirely by audio (below) plus two clipped screenshots. |

## BLOCKING issues

**None.** Specifically checked and cleared:

- No number on screen or in VO contradicts `FOOTAGE.md`. The scene-02 counter animates 43 → **48** and rests there. The scene-04 stat bar animates 18/9/8 → **25 / 12 / 11**. Scene 07 reads **39 of 44** and **7:21 / 2:58**. All canonical.
- My earlier required change #1 (the invented "three replacements") **was applied** — the VO is count-free and the footage shows three chips anyway.
- Required change #2 (trim to ≤155s) **was applied** — narration totals 137.0s.
- Required change #3 (the Northstar evidence claim) **was applied and is verified by the picture**. The VO says "real businesses operating under that name"; the panel legibly reads "Web research identified multiple active businesses operating under the exact or very similar names." The narration is, if anything, more conservative than the evidence. This was the highest-risk line in the script and it is now airtight.
- No fabricated UI. Every app frame is live-run footage.

## Improvements, ranked by impact per minute of work

1. **Get a real product frame on screen inside the first 5 seconds.** *Highest impact overall.* The VO is fine — do not re-record. Behind the existing title card, run the scene-04 highlight-flip footage as a low-opacity plate or a small inset from ~0:04, or simply shorten the card to ~6s and let the app come up under the remaining stat lines. There are 36 unused seconds against the cap, so nothing has to be cut to pay for it. This converts the weakest 15 seconds of the video into the strongest.

2. **One `loudnorm` pass to −14 LUFS, plus a quiet bed.** *Best impact per minute — roughly five minutes of work.* Integrated loudness is **−19.8 LUFS**, about 6 LU under the platform norm; YouTube attenuates loud uploads but never boosts quiet ones, so this will play audibly softer than every competing submission. Worse, the gaps are **pure digital silence** (`astats` reports a −inf noise floor across 307k samples), which makes the two deliberate holds read as dropouts rather than as beats. A −40 dB ambient pad or a restrained score under the whole thing fixes both — and a score is thematically free money at a hackathon called Agentic Cinema.

3. **Hold the completed end card 2–3s longer.** The URL and repo line appear around 2:22 and the file ends at 2:24. A judge cannot read, let alone copy, the Cloud Run link. Extending to ~2:27 stays far under the cap and is a one-number change.

4. **Fix the right-edge crop on the two wide app shots** (≈0:48 and ≈0:56). The Ken Burns scale pushes the risk-ledger sidebar past frame, clipping the category labels to "per", "br", "busin", and shaving the wordmark on the left. Pull the scale back ~4%.

5. **Low priority — the cross-run progression at 0:44–0:50.** Per `FOOTAGE.md` this is the honest pending→mid→done sequence, but it cuts from 3/2/2 to 21/11/12 (job `8b5d791e07d4`) to 25/12/11 (job `6b1b3eacd1dd`), and across that cut the *clear* count goes 12 → 11 — which cannot happen inside a single run. It is on screen for ~2s and no judge will freeze-frame it. Worth knowing, not worth a re-edit.

6. **Optional — one glimpse of code.** The scene-09 spec offered a ghosted `agent/pipeline.py` behind the architecture diagram and it was not used. The diagram is credible and specific on its own (SequentialAgent, five named stages, the Pro/Flash split matching the Devpost), but two seconds of real ADK source is the cheapest possible answer to "did they actually build it."

## What must NOT change

- The scene 03 → scene 07 determinism setup and payoff. Still the smartest structural move in the piece, and the render sells it better than the script did — "The same queries. Every run." on screen at 0:40 pays off visually in the carried-over badges at 1:45.
- "A conflict list is a problem. A conflict list with fixes is a product." The full-frame typographic treatment at 1:20 is exactly right.
- The evidence push-in and its silent hold. Do not add narration over it.
- The 7:21 / 2:58 bar comparison.
- The end card's URL + repo + dual sponsor badges.

## Would it place top 3 in a Parallel-track field?

Yes — and it has a real case for first. Most sponsor-track submissions use the search API as a lookup and
say so once. This one makes deterministic Parallel queries the load-bearing reason a downstream feature
(the revision loop) is possible, shows the literal query strings twice, and shows Parallel being used a
second time to *verify the fix* — which is the beat most teams will not have. Add the mandatory-purchase
business framing and a working hosted app, and the only thing standing between this and the top of the
pile is that a tired judge might not still be watching at 0:15. Fix improvement #1 and that risk goes away.
