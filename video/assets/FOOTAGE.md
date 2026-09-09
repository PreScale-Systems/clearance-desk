# FOOTAGE.md — real screenshots of the live app

All PNGs are 1920x1080 viewport captures of https://clearance-desk-769027363263.us-central1.run.app
taken 2026-09-09/10 from live runs. Nothing is mocked. Jobs referenced below are still on the
server and can be re-opened with `/?job=<id>`.

## The runs behind the footage

| Job | Script | Result | Duration | Notes |
|---|---|---|---|---|
| `6b1b3eacd1dd` | the_ledger_v1.fountain | 48 items: **25 conflict / 12 caution / 11 clear** | **7m 21s** | primary "done" job used for shots 4–8 |
| `2b84c37b55da` | revision of 6b1b3eacd1dd (JOSEPHINE STERLING applied) | 44 items: 22/12/10, **39 verdicts reused** | **2m 58s** | the carryover job (shot 9) |
| `8b5d791e07d4` | the_ledger_v1.fountain (re-run) | 21/12/14 | ~7m | used only for the in-progress shots 2–3 |

**IMPORTANT — numbers for narration.** The BRIEF's canonical facts (17/16/15, "reused 41",
"Eleanor Preston") come from an earlier server-side run that no longer exists. The pipeline is
mildly non-deterministic, so this footage shows: **48 items, 25 conflict / 12 caution / 11 clear;
revision reused 39 of 44 verdicts and finished in 2m58s vs 7m21s (well under half the time);
CAROLINE MERCER's verified-clean alternatives are JOSEPHINE STERLING ✓ and GENEVIEVE PRESCOTT ✓**
(not Eleanor Preston). Any number said in VO that appears on screen must match these, or avoid
being that specific ("about fifty items", "verified clean alternatives").

## Files

- **home.png** — Landing page, empty state. Hero "Clear a draft in minutes, not weeks.",
  drop-zone + paste box, three sample buttons (GOLDEN HOUR / THE LEDGER first draft / THE LEDGER
  revised), the 4-stage Extract→Research→Judge→Fix strip, and the empty risk ledger (0/0/0) top-right.
- **clearing-pending.png** — Seconds after verdicts start (job 8b5d791e07d4). Header ticker
  "Weighing the evidence", counts 3 conflict / 2 caution / 2 clear, ledger shows the mixed state:
  a few resolved rows on top, then a wall of gray `pending` chips. Script visible on the left with
  highlights already painted. This IS a "verdicts arriving" frame.
- **clearing-mid.png** — Same run ~30s later. Counts 21/11/12, ticker still "Weighing the evidence",
  visible ledger rows are the sorted conflicts (pending rows exist but are sorted below the fold).
  Use pending → mid → remediating → done as the progression.
- **clearing-remediating.png** — Job 6b1b3eacd1dd during the Fix stage. Ticker "Finding clean
  replacements", final counts 25/12/11 already on the board, all-conflict rows visible.
- **done-overview.png** — Finished job 6b1b3eacd1dd. Script with red/amber/green highlights,
  counts 25/12/11, and the full attorney-style **Memo** paragraph at the top of the ledger.
  Footer: "Pick a replacement to revise the draft" + disabled "Clear revised draft".
- **conflict-detail.png** — NORTHSTAR CONSULTING GROUP row expanded. Script auto-scrolled and the
  highlight gets a boxed outline. Panel shows: item description, the judge's reasoning ("Web research
  identified multiple active businesses… high risk of confusion and potential defamation claims"),
  and the "**Change the name.**" recommendation with the start of the replacement list.
- **conflict-evidence.png** — Same item scrolled down: cited evidence including the Florida corporate
  registry ("an active entity 'NORTHSTAR CONSULTING GROUP LLC' (L25000420174), an exact match"),
  replacement chips (Aegispoint Holdings / Veridian Praxis Group / Lindenmark Advisory), and the
  literal `searched:` Parallel queries — good for the "same queries every time / reproducible" beat.
- **alternatives.png** — CAROLINE MERCER conflict expanded. Reasoning names the real AUSA
  "Caroline Merck" with a LinkedIn evidence link, and shows the replacement chips:
  ELEANOR CALDWELL (unverified), **JOSEPHINE STERLING ✓**, **GENEVIEVE PRESCOTT ✓** (green check =
  re-searched and verified clean). Script side shows both CAROLINE MERCER occurrences highlighted.
- **replacement-applied.png** — After clicking JOSEPHINE STERLING ✓: in the script,
  ~~CAROLINE MERCER~~ is struck through with JOSEPHINE STERLING inserted next to it (both
  occurrences). Footer reads "**1 replacement applied — re-clear only what changed**" with the
  now-enabled "Clear revised draft" button. Great beat right before the revise cut.
- **revise-carryover.png** — The revise run (job 2b84c37b55da) near the end ("Writing the memo").
  Header chips: `pasted-draft` + **`revision of 6b1b3eacd1dd`**; script draft date reads
  "Revised via Clearance Desk". Ledger rows carry gray **"carried over"** badges; Boston Herald
  shows a **"new"** badge. This is the only-re-clear-what-changed proof shot.
- **memo.png** — Full memo paragraph at ledger top with counts 25/12/11, script ending on the left.
  (Memo also appears in done-overview.png; this frame has it fully unclipped.)
- **report.png** — `/api/jobs/6b1b3eacd1dd/report.md` rendered by the browser as plain monospace
  text: title, Draft/Job/Fingerprint line, Logline, Setting, Summary, and the big `## Items`
  markdown table (Risk | Element | Category | Scene | Page | Recommendation). Note: raw `**` markers
  are visible since it's unrendered markdown — that's authentic for an "export" beat; the Remotion
  dev may prefer to show only the top half.

## Capture notes / UI quirks for the Remotion developer

- Layout: script column is centered-left (~640px wide); the risk ledger is a sticky right sidebar
  (~440px). Large empty margins left of the script at 1920 wide — safe area for overlaying
  captions/callouts without covering UI.
- Highlight colors: red = conflict, amber/orange = caution, green = clear, pale pink/underline
  before a verdict lands. Ledger chips: solid red `conflict`, amber `caution`, gray `pending`,
  green `clear`. Ledger sorts conflict → caution → pending/clear, so late-run frames show only
  conflicts up top.
- Status ticker (top-right of header) cycles: "Reading the script" → "Searching the live web" →
  "Weighing the evidence" → "Finding clean replacements" → "Writing the memo". It's small —
  consider a zoom/crop if a beat depends on it.
- Clicking a ledger row expands it in place AND auto-scrolls/outlines the matching script highlight.
- Run pacing (for a progress-bar or time-lapse feel): extraction ~50-80s with an empty ledger, then
  research+judging resolves all ~48 items in about 60-90s, then remediation ~3-4 min. The judge
  phase is fast — real-time capture of a 50/50 split was not possible twice in a row; the
  pending/mid pair above is the honest progression.
- Verdicts vary slightly between runs (e.g. Dunkin' was clear in job 6b1b3eacd1dd but conflict in
  8b5d791e07d4). Do not mix frames from different runs within one continuous "same job" sequence —
  shots 2–3 are from 8b5d791e07d4, shots 4–9 from 6b1b3eacd1dd/2b84c37b55da. The counts visibly
  differ (21/11/12 vs 25/12/11), so a hard cut between them should be separated by a beat change.
- All shots except report.png include the app header (CLEARANCE DESK wordmark + "script clearance,
  before legal sees it").
- Shot 9 was fully feasible: no v2 sample needed — the in-app replacement flow (pick chip → Clear
  revised draft) produced the carryover run in under 3 minutes.
