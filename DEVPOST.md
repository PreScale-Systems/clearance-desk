# Devpost submission — Clearance Desk (Parallel track)

## Inspiration
Every screenplay gets a clearance report before it shoots: a legal read that checks whether "Daniel Reyes, attorney, Boston" is a real attorney in Boston, whether the bar in scene 12 is a real bar, whether the song on the radio needs a license. It costs thousands per draft and takes one to three weeks, and it restarts on every rewrite. We wanted the first pass to take minutes and to only re-check what changed.

## What it does
Upload a draft. Clearance Desk extracts every clearance-sensitive element (names, businesses, brands, titles, locations, identifiers, organizations), researches each one on the live web through Parallel's Search API, scores it clear / caution / conflict with cited evidence and a clearance-attorney-style recommendation, and for conflicts proposes replacement names that are searched again and verified clean. Upload the revision and unchanged items carry their verdicts forward. Export a full report.

## How we built it
- Google ADK `SequentialAgent` with five stages: extractor (LlmAgent, Gemini 2.5 Pro, strict output schema), researcher (deterministic BaseAgent fanning out to Parallel Search), judge (Gemini 2.5 Flash with structured verdicts), remediator (Gemini proposals re-verified through Parallel), reporter (Gemini 2.5 Pro memo).
- Parallel Search API via the `parallel-web` SDK, `fast` mode, 2–3 templated queries per item plus an objective so results are focused on identity collisions.
- FastAPI on Cloud Run, Gemini through Vertex AI, Firestore for job persistence, Secret Manager for the Parallel key, server-sent events to stream progress into the UI.
- The UI renders the screenplay itself with highlights that resolve live as evidence arrives, next to a risk ledger with evidence links and one-click replacements.

## Challenges
Extraction needs to capture *how* the script uses a name, not just the name — otherwise the judge can't tell a namesake from a defamation risk. Letting the model write its own search queries made results drift between runs, which broke revision diffing; templated queries per category fixed it. Balancing cost meant Flash for per-item judgment and Pro only for extraction and the memo.

## Accomplishments
A real workflow, end to end, that a producer can use tomorrow: from PDF to a cited report with verified fixes in a few minutes, and a revision loop that only pays for what changed.

## What we learned
Deterministic tool stages inside an agent network are what make the output auditable. The LLM belongs where judgment is needed — reading the script, weighing evidence, drafting the memo — not in the middle of the research loop.

## The business
Clearance is a mandatory purchase: every distributor requires E&O insurance, and E&O underwriters require a clearance report. Today that report costs $1,000–$5,000+ per feature and is produced by a handful of boutique research shops — none of them automated. We don't replace the attorney who signs the report; we make the research behind it instant. Two products, one pipeline:

- **Copilot for clearance houses and studio legal** — the shop runs Clearance Desk first, reviews instead of researches, and still signs. Priced per seat/report at roughly $1,000/month per shop; 80 clearance shops, studio and streamer legal-ops teams ≈ **$1M ARR**.
- **Draft-stage self-serve for the long tail** — indie features, docs, YouTube and podcast fiction that can't afford a $1,500 report today get a cited first pass at $99 per draft (with a $29/month writers' plan inside screenwriting tools); 15–20k drafts a year ≈ **$1.5–2M ARR**.

That's a low-single-digit-millions ARR business on the core product alone, before the upside: every brand flagged *caution* is also a product-placement lead, and the same pipeline extends to chain-of-title and music-rights checks — the rest of the rights-and-clearances stack.

## What's next
Pilot with two clearance houses (report export in their house format is the whole integration), chain-of-title and rights lookups for adapted IP, and the product-placement flip — turning brand cautions into a monetizable placement list.

## Built with
google-adk, google-genai, Gemini 2.5 Pro / Flash, Vertex AI, Cloud Run, Firestore, Secret Manager, Parallel Search API (parallel-web), FastAPI, Python

## Links
- Hosted app: <CLOUD RUN URL>
- Repo: <GITHUB URL>
- Video: <YOUTUBE URL>
