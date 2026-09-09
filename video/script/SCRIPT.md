# Clearance Desk — 3-minute demo script (rev 3, post judge review + footage continuity)

10 scenes · 370 narration words · ~154 s at 2.4 words/sec (~168 s if TTS measures 2.2) — inside the judge's ≤155 s budget, leaving real air in the 3:00 ceiling. Applies all three REQUIRED changes plus the nice-to-haves from `../reviews/judge-script.md`, and rev 3 aligns every number and name to the captured runs in `../assets/FOOTAGE.md` (now canonical per BRIEF.md). Every number in the narration comes from the real cleared runs listed in `BRIEF.md`; nothing is fabricated. Narration is TTS-safe: short sentences, dollar amounts and counts in words, "errors and omissions insurance — E and O —" expanded once in scene 01, then "E and O" thereafter.

Reclaimed time is spent as deliberate silence: **1.5 s hold** after the 25/12/11 stat bar (scene 04) and **1.5 s hold** on the citation push-in (scene 05) — both encoded as `hold_seconds` in `narration.json` for the Remotion developer — plus a **0.5 s beat** before "Clearance Desk." in scene 10 (`tts_note` for the sound agent).

---

## Scene 01 — The Problem and the Money (50 words · ~21 s)

**VO:** Every script gets a clearance report before it shoots. Every name, brand, and song, checked by hand. One thousand to five thousand dollars per draft. One to three weeks. It starts over on every rewrite. Errors and omissions insurance — E and O — requires it. This is Clearance Desk.

**Visual:** Dark title card with small sponsor badges from second one ("Parallel Search API · Google ADK + Gemini"), three stat lines animating in sync with the VO ($1,000–$5,000 / 1–3 weeks / restarts every rewrite), then hard cut to a screenshot of the empty live app with the product name overlaid.

## Scene 02 — Upload and Extraction (32 words · ~13 s)

**VO:** Upload The Ledger, a Boston legal thriller. Gemini reads the draft and extracts every clearance-sensitive item: names, businesses, brands, songs, addresses. Forty-eight items, each tied to where it appears in the script.

**Visual:** Real app: sample picker → screenplay renders with pending grey highlights; status ticker reading → searching; counter ticks to 48 items.

## Scene 03 — Live Research via Parallel (35 words · ~15 s)

**VO:** Then each item goes to the live web through Parallel's Search API. Two to three templated queries per item — the same queries every run. That determinism matters; you will see why in a minute.

**Visual:** Split view: risk ledger in "researching" state | Remotion fan-out graphic of the DANIEL REYES item (the Devpost's own example) spawning fixed monospace queries into a "Parallel Search API" node (badge: mode fast).

## Scene 04 — Verdicts Land (34 words · ~14 s + 1.5 s hold)

**VO:** As evidence comes back, Gemini judges each item against it. Highlights resolve live — green clear, amber caution, red conflict. The Ledger: twenty-five conflict, twelve caution, eleven clear, every verdict backed by cited sources.

**Visual:** The money shot: script highlights flipping grey → green/amber/red (clearing-pending / clearing-mid progression, then done-overview). End on a stat bar with the real totals — 48 items, **25 conflict / 12 caution / 11 clear**, conflict-first like the app's ledger sort (conflicts dominate: half the draft is a legal problem) — then **hold it in silence for 1.5 s**. Let the numbers land. Per FOOTAGE.md, shots 2–3 come from a different run than the finished job — separate them with a beat change.

## Scene 05 — Anatomy of a Conflict (44 words · ~18 s + 1.5 s hold)

**VO:** Click a conflict. Northstar Consulting Group — in the script, a shell company receiving suspicious wires. On the live web, Parallel surfaced real businesses operating under that name. Gemini scored it a conflict and wrote the reasoning like a clearance attorney, with sources linked.

**Visual:** Zoom into the real NORTHSTAR CONSULTING GROUP detail panel: portrayal, verdict, attorney-style rationale, real evidence URLs. Slow push-in on the citations, then **hold on them in silence for 1.5 s** — the credibility anchor. Actual screenshots (conflict-detail.png, conflict-evidence.png), not mockups. The footage confirms the judge's safe wording: the evidence panel cites an active Florida registry entity "NORTHSTAR CONSULTING GROUP LLC", an exact match — keep that citation line legible in the push-in.

## Scene 06 — Verified Replacements (42 words · ~18 s)

**VO:** A conflict list is a problem. A conflict list with fixes is a product. Caroline Mercer, the prosecutor character, got proposed replacements — each one searched again through Parallel and judged again. Josephine Sterling came back verified clean before it was shown.

**Visual:** CAROLINE MERCER entry with replacement chips (alternatives.png — narration is deliberately count-free; the footage shows ELEANOR CALDWELL unverified, JOSEPHINE STERLING ✓, GENEVIEVE PRESCOTT ✓). Highlight the "JOSEPHINE STERLING" chip and its verified checkmark. Annotation: searched again via Parallel → judged again → verified.

## Scene 07 — The Revision Loop (39 words · ~16 s)

**VO:** Now the rewrite — upload the revision. Because the queries are deterministic, unchanged items carry their verdicts forward: thirty-nine of forty-four came straight over, only the changes were researched, and the run finished in under three minutes, not seven.

**Visual:** Revision screenshots (replacement-applied.png → revise-carryover.png): "carried over" badges on unchanged items, the Boston Herald row wearing its "new" badge. Overlay stats: 39 of 44 carried over · 2:58 vs 7:21. **Required (promoted from optional):** a quick before/after diff flash — CAROLINE MERCER struck through, JOSEPHINE STERLING inserted.

## Scene 08 — The Exportable Report (26 words · ~11 s)

**VO:** When it finishes, export the report. An attorney-style memo up top, then every item with its verdict, evidence, and reasoning. Ready for the lawyer who signs.

**Visual:** Exported markdown report scrolling slowly: memo paragraph, then the itemized verdict table with citations.

## Scene 09 — Under the Hood (39 words · ~16 s)

**VO:** Under the hood: one Google ADK sequential agent, five stages. Gemini where judgment lives — reading the draft, weighing evidence, writing the memo. Parallel Search for all the research, on templated queries. That split is what makes revisions trustworthy.

**Visual:** Architecture diagram matching the README: SequentialAgent → extractor (Gemini 2.5 Pro) · researcher (Parallel Search) · judge (Gemini 2.5 Flash) · remediator (Parallel + Gemini) · reporter (Gemini 2.5 Pro). Color-code Gemini vs deterministic stages; footer badges for ADK / Vertex AI / Cloud Run / Firestore.

## Scene 10 — The Close (29 words · ~12 s)

**VO:** Every distributor requires E and O insurance. Every E and O policy requires this report. Nobody has automated it — until now. *(0.5 s beat)* Clearance Desk. Clear a draft in minutes.

**Visual:** Finished report view dissolving to the closing card: Clearance Desk · "Clear a draft in minutes." · live URL · Parallel Search API + Google ADK/Gemini badges. Hold two seconds after the last word. **Sound agent:** insert the 0.5 s pause before "Clearance Desk." (see `tts_note` in narration.json); also verify "Northstar" and "Mercer" pronunciations before batch-generating.

---

## Changes applied from the judge review (rev 2)

- **Required 1:** Scene 06 no longer claims "three" replacements — count-free wording per the judge; the visual notes the editor shows whatever the footage has.
- **Required 2:** Narration trimmed 400 → 370 words (~154 s at 2.4 wps, ~168 s at 2.2 wps — safe even at a slower measured TTS rate). Judge's per-scene cuts applied (scenes 01, 02, 05, 09) plus small extra trims in scenes 04, 06, 08, 10 to reach the budget without touching the protected elements. Reclaimed time became `hold_seconds` on scenes 04 and 05.
- **Required 3:** Scene 05 uses the footage-safe evidence claim: "Parallel surfaced real businesses operating under that name."
- **Nice-to-haves:** "errors and omissions insurance — E and O —" expanded once in scene 01; sponsor badges on the scene 01 cold open; DANIEL REYES as the scene 03 query example; scene 07 diff flash promoted to required; 0.5 s beat before the scene 10 tagline.
- **Untouched, per the judge:** the scene 03 → 07 determinism setup/payoff, "A conflict list is a problem. A conflict list with fixes is a product.", the open/close mirror.
- **Rev 3 (continuity):** all numbers/names re-aligned to the captured runs in FOOTAGE.md, now the canonical facts: 48 items at 25 conflict / 12 caution / 11 clear (conflict-first — half the draft is a legal problem); revision reused 39 of 44 verdicts and finished in 2:58 vs 7:21 ("under three minutes, not seven"); Caroline Mercer's verified-clean replacement is Josephine Sterling. Scene 05's safe Northstar wording was confirmed by footage (exact-match Florida registry entity). Pacing, holds, and all other lines unchanged; word total held at 370.

## Rationale

The structure front-loads the two things Devpost judges reward: within twenty seconds they know the problem is real, expensive ($1k–$5k, 1–3 weeks), and mandatory (E and O insurance) — so the demo that follows is a business, not a toy. The middle six scenes are one continuous product story on real footage with real numbers (48 items, 25/12/11 with conflicts dominating, Northstar's live-web evidence, Josephine Sterling verified, 39 of 44 carried over), and scene 03 deliberately plants "deterministic queries" so the revision payoff in scene 07 lands as engineering, not luck — which the single tech scene (09) then names explicitly for the Parallel + ADK judging criteria. The two silent holds put air around the stat bar and the citations — the video's two proof moments — instead of narrating over them. Closing by repeating the mandatory-purchase chain and the tagline gives the video a quotable last line and mirrors the opening, which is the shape memorable three-minute demos take.
