# 3-minute demo — shot list

Record at 1920×1080, browser only (no slides), narrate over it. Have `the_ledger_v1.fountain` already cleared once in a second tab so a finished report is ready if the live run is slow.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:20 | Empty Clearance Desk page on the Cloud Run URL | "Every script goes to a clearance house before it shoots. Thousands of dollars, one to three weeks, and it starts over on every rewrite. This is Clearance Desk." |
| 0:20–0:45 | Click *The Ledger — first draft*. Script appears, highlights turn pending; status ticker: reading → searching | "Gemini reads the whole draft and pulls every name, business, brand, song, address and phone number. Each one is researched on the live web through Parallel's Search API — the same queries every time, so it's reproducible." |
| 0:45–1:20 | Highlights flip to red / amber / green as verdicts arrive. Click a red person name. | "Here's why this matters. Daniel Reyes — junior partner in Boston, portrayed as a whistleblower. Parallel found [a real attorney with that name in the same city]. Gemini scored it a conflict and explained it the way a clearance attorney would, with the sources." |
| 1:20–1:45 | Scroll to the replacement chips. Hover one with ✓. | "For every conflict it proposes replacements that keep the character's feel — and each one was searched again and verified clean before it's shown." |
| 1:45–2:10 | Click a replacement; it strikes through in the script. Click *Clear revised draft*. Ledger shows *carried over* badges and only the new name pending. | "Pick one, re-clear. Unchanged items keep their verdicts; only what changed is researched. That's the difference between a per-draft cost and a per-change cost." |
| 2:10–2:35 | Open the memo paragraph; click *Export report*, show the markdown. | "The memo reads like the first page of a clearance report, and the export has every item, the evidence, and the reasoning." |
| 2:35–2:55 | Quick cut to the repo: `agent/pipeline.py` and `agent/research.py` | "Under the hood: one ADK sequential agent, five stages, Gemini for extraction, judgment and the memo, Parallel Search for all of the research, on Cloud Run with Firestore." |
| 2:55–3:00 | Back to the finished report | "Every distributor requires E&O insurance, and every E&O policy requires this report. Nobody has automated it. Clearance Desk. Clear a draft in minutes." |

Tips: turn off browser extensions; zoom the page to 110%; if the live run stalls, switch to the pre-cleared tab and keep talking.
