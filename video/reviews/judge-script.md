# Judge review — script draft (narration.json + SCRIPT.md)

Reviewed: 2026-09-09, against `video/BRIEF.md` (real-run facts), `DEVPOST.md`, and the Parallel-track judging criteria (real Parallel Search + ADK/Gemini usage, real problem, working product, demo clarity).

## Verdict: REVISE

This is a strong draft — top-quartile structure for a 3-minute Devpost video. The mandatory-purchase framing in the first 21 seconds, the deterministic-queries setup in scene 03 paying off in scene 07, and the quotable "A conflict list is a problem. A conflict list with fixes is a product." are exactly what makes judges lean in. The revise is narrow: one invented number, one evidence claim that must match footage, and a real pacing risk at 167s of narration in a 180s ceiling.

## Scores

| Criterion | Score /10 | Notes |
|---|---|---|
| Hook (first 15s) | 8 | Money and mandatory-ness land fast. By second 15 a judge knows: real problem, $1k–5k, weeks, restarts every rewrite. Product name arrives at ~20s — acceptable, not ideal. "E and O" will be opaque to some judges (see nice-to-have 1). |
| Sponsor-tech centrality | 9 | Parallel is structural, not garnish: named in scenes 03, 05, 06, 09, and the determinism thread makes Parallel the *reason* the revision loop works. The re-search-the-replacement beat (06) is the single best sponsor moment — it shows Parallel used twice per fix. |
| Demo clarity | 9 | Real footage, real numbers (48, 17/16/15, 41/48), one continuous story through the app. Scene 05's push-in on real citation URLs is the credibility anchor. ADK/Gemini scene 09 is credible and specific (SequentialAgent, five named stages, Pro-vs-Flash split matches the Devpost). |
| Wow beat | 8 | Scene 04 (highlights flipping live across the screenplay) is the visual wow; scene 07 (41 of 48 carried over, half the time) is the engineering wow, well set up by scene 03. The wow beats currently have zero silence around them — see required change 2. |
| Ending | 8 | Mirrors the open, repeats the mandatory chain, quotable tagline. "until now" is earned by the Devpost's own claim. Solid, not transcendent. |

## REQUIRED changes

1. **Scene 06 — remove the invented number "three."** The narration says Caroline Mercer "got three proposed replacements." Neither BRIEF.md nor DEVPOST.md states a count; the BRIEF's rule is that any number shown must come from a real run. Either (a) the editor confirms the real replacement-chip count from the actual footage and the number is corrected to match, or (b) reword to be count-free. Suggested wording: "Caroline Mercer, the prosecutor character, got proposed replacements — each one searched again through Parallel and judged again." This also saves two words.

2. **Global — trim narration from ~167s to ≤155s (cut roughly 30–35 words).** 167s of speech in a 180s ceiling leaves 1.3s per scene for transitions, and zero air on the two wow beats. Worse, 167s assumes 2.4 words/sec; if the sound agent's measured TTS rate comes in at 2.2, this script runs ~182s and busts the hard 3:00 limit. Cut before recording, not after. Specific cuts that cost nothing:
   - **Scene 01:** "Every name, business, brand, and song, checked by hand." → "Every name, brand, and song, checked by hand." (−1 word) and consider dropping "It is mandatory —" since "E and O insurance requires it" already says so (−3).
   - **Scene 02:** "character names, businesses, brands, song titles, addresses, phone numbers" → "names, businesses, brands, songs, addresses" (−3); "each one typed and tied to where it appears in the script" → "each tied to where it appears in the script" (−2).
   - **Scene 09:** The sentence "Deterministic tools, Gemini for judgment." restates the two sentences before it — cut it entirely (−6). Suggested tightened VO: "Under the hood: one Google ADK sequential agent, five stages. Gemini where judgment lives — reading the draft, weighing evidence, writing the memo. Parallel Search for all of the research, on templated queries. That split is what makes revisions trustworthy."
   - **Scene 05:** "and wrote the reasoning like a clearance attorney would, with every source linked" → "and wrote the reasoning like a clearance attorney, with every source linked" (−1).
   - Target the reclaimed seconds as deliberate silence: ~1.5s hold after the 17/16/15 stat bar (scene 04) and ~1.5s hold on the citation push-in (scene 05). That silence is what makes judges lean in.

3. **Scene 05 — the evidence claim must match the footage.** "Parallel found real consulting firms under that name" asserts a specific plural finding. BRIEF only guarantees "NORTHSTAR CONSULTING GROUP flagged with real-web evidence." Before recording, the editor must confirm what the detail panel actually shows; if it's not clearly multiple real consulting firms, reword to the safe version: "On the live web, Parallel surfaced real businesses operating under that name." A judge who pauses on that frame and sees the evidence not matching the narration will discount every other number in the video.

## Nice-to-haves (do not block recording)

- **Scene 01:** Expand the acronym once for non-industry judges: "It is mandatory — errors-and-omissions insurance requires it" (then "E and O" freely thereafter, including scene 10). Weigh against required change 2's word budget.
- **Scene 01 visual:** Add small "Parallel Search API · Google ADK + Gemini" badges to the cold-open title card so the sponsor stack is on screen inside the first 10 seconds, not first heard at 0:39.
- **Scene 03:** "you will see why in a minute" is good tension — keep it. Consider having the on-screen query strings use the DANIEL REYES example from the Devpost so script and Devpost rhyme.
- **Scene 07 visual:** The before/after diff flash (renamed character) is listed as optional — promote it; it's the fastest way to make "only the changes were researched" legible without narration.
- **Scene 10:** After "until now," a 0.5s beat before "Clearance Desk." will make the close land harder in TTS.
- **Sound agent:** verify "Northstar" and "Mercer" pronunciations in the chosen voice before batch-generating.

## What must NOT change

- The scene 03 → scene 07 determinism setup/payoff. This is the smartest structural move in the script.
- "A conflict list is a problem. A conflict list with fixes is a product." — the most quotable line; likely to end up in a judge's notes verbatim.
- The mandatory-purchase open/close mirror.
- All real-run numbers as listed in BRIEF.md: 48 items, 17/16/15, 41 of 48, half the time, Eleanor Preston verified clean.
