# Clearance Desk — 3-minute Devpost video: production brief

This directory is the shared workspace for a multi-agent video production. Every agent
reads this brief first, does its job, writes its deliverable to the exact path listed,
and records notes for downstream agents.

## The product being demoed

Clearance Desk (this repo) — agentic script clearance for screenplays.
- Live app: https://clearance-desk-769027363263.us-central1.run.app
- Read `../README.md`, `../DEVPOST.md`, and `../VIDEO.md` (the human shot list — our
  starting point, not a constraint) before doing anything.
- Pipeline: Gemini extracts every clearance-sensitive item from a screenplay → Parallel
  Search API researches each on the live web → Gemini judges clear/caution/conflict with
  cited evidence → conflicts get replacement names re-searched and verified → attorney-style
  memo. Revisions only re-clear what changed.
- Winning pitch line: every distributor requires E&O insurance, every E&O policy requires
  this report, it costs $1k–5k and 1–3 weeks per draft today, and nobody has automated it.
- Hackathon: "Agentic Cinema", Parallel track. Judges care about: real use of Parallel
  Search API + Google ADK/Gemini, a real problem, a working product, and demo clarity.

## Hard constraints

- Final video: **at most 3:00**, 1920×1080, 30fps, H.264 MP4 with voiceover audio.
- Output: `video/out/clearance-desk-demo.mp4`
- Everything is generated: Remotion for visuals, pocket-tts for narration. No human
  recording. Screenshots of the real live app are strongly encouraged as footage.
- Do not fabricate product results: any numbers/verdicts shown must come from real runs.
  CANONICAL FACTS live in `assets/FOOTAGE.md` (the runs behind the actual screenshots):
  The Ledger v1 → 48 items, 25 conflict / 12 caution / 11 clear, cleared in 7m21s;
  revision reused 39 of 44 verdicts, finished in 2m58s; CAROLINE MERCER → verified-clean
  alternative "JOSEPHINE STERLING"; NORTHSTAR CONSULTING GROUP flagged with an exact-match
  Florida corporate-registry entity. Narration numbers MUST match FOOTAGE.md, not this list's
  earlier revision.

## File contracts (who writes what)

| Path | Written by | Contents |
|---|---|---|
| `script/narration.json` | script writer | array of scenes: `{id, title, narration, visual, target_seconds}` summing to ≤170s of narration (leave breathing room) |
| `script/SCRIPT.md` | script writer | human-readable script + rationale |
| `reviews/judge-script.md` | judge | verdict + required changes on the script |
| `reviews/judge-final.md` | judge | verdict on the rendered video |
| `SOUND-NOTES.md` | sound agent | chosen voice, measured speaking rate, how to regenerate |
| `audio/scene-<id>.wav` | sound agent | one VO clip per scene |
| `audio/durations.json` | sound agent | `{scene_id: seconds}` measured from the wav files |
| `assets/` + `assets/FOOTAGE.md` | editor | real screenshots of the live app, manifest describing each |
| `REMOTION-GUIDE.md` | remotion specialist | project layout, key APIs, audio/image embedding, render commands |
| `remotion/` | remotion specialist (scaffold) + remotion developer (scenes) | the Remotion project |
| `EDIT-NOTES.md` | editor | pacing/cut feedback after preview render |

## Rules

- Scene durations in the composition MUST be driven by `audio/durations.json` (+ padding),
  never guessed.
- Keep `remotion/node_modules` and `out/` out of git (there is a `.gitignore` here).
- If a dependency or API doesn't work as expected, write what you found in your notes file
  so the next agent doesn't rediscover it.
