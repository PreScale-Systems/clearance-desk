# Clearance Desk

**Script clearance in minutes.** Upload a screenplay draft; every character name, business, brand, song title, address and phone number is checked against the live web and comes back as *clear*, *caution* or *conflict* — with cited evidence, a clearance-attorney-style memo, and replacement names that have already been verified clean. Revise the draft and only what changed gets re-cleared.

Built for the **Agentic Cinema hackathon — Parallel track**, on Google Cloud Agent Builder (ADK) + Gemini, with the Parallel Search API as the research engine.

## Why this exists

Before a script is locked, a clearance house reads it and checks every name and reference for defamation, trademark and copyright exposure. That costs studios thousands of dollars and one to three weeks per draft, and it starts over on every revision. Writers get notes like *"there is a real attorney with this name in Boston"* weeks after they've moved on. Clearance Desk makes the first pass instant and repeatable, so legal starts from a vetted list instead of a blank page.

## How it works

```
Screenplay ─▶ ScriptClearance (ADK SequentialAgent)
               ├─ extractor    LlmAgent (Gemini 2.5 Pro)   reads the draft → typed item list
               ├─ researcher   BaseAgent                   deterministic fan-out → Parallel Search API
               ├─ judge        BaseAgent (Gemini 2.5 Flash) scores each item against its evidence
               ├─ remediator   BaseAgent                   proposes names, re-searches via Parallel, verifies
               └─ reporter     LlmAgent (Gemini 2.5 Pro)   writes the memo
```

- **Extraction** uses ADK's `output_schema` so the item list is strictly typed (`agent/models.py`). Same script → same items.
- **Research** is deliberately not an LLM step. `agent/research.py` builds 2–3 search queries per item from a fixed template per category and calls `Parallel(...).search(...)` (`parallel-web` SDK, `mode=fast`). Deterministic queries are what make draft-to-draft diffing trustworthy.
- **Judgment** gives Gemini the item, how the script portrays it, and the Parallel excerpts, and asks for a structured verdict with citations and a recommendation.
- **Remediation** asks Gemini for three replacement names that keep the character's feel, then runs each back through Parallel + the judge. Only names that come back *clear* are marked verified.
- **Revision**: `POST /api/jobs/{id}/revise` keys items by `(category, normalized text)`; unchanged items carry their verdict forward and only new or renamed items are researched.

Runtime integrations are in code, not just the README:

| Requirement | Where |
|---|---|
| Google ADK agents | `agent/pipeline.py` (`google.adk.agents.SequentialAgent`, `LlmAgent`, `BaseAgent`), run via `google.adk.runners.InMemoryRunner` in `app/jobs.py` |
| Gemini via `google-genai` | `agent/pipeline.py` (`google.genai.Client`) |
| Parallel Search API | `agent/research.py` (`from parallel import Parallel`, `client().search(...)`) |
| Google Cloud runtime | Cloud Run (`Dockerfile`, `scripts/deploy.sh`), Vertex AI for Gemini, Firestore for job persistence (`STORE=firestore`) |

## Run it

```bash
cp .env.example .env         # add GOOGLE_API_KEY (or Vertex settings) and PARALLEL_API_KEY
./scripts/run_local.sh       # http://localhost:8080
```

Command line, no UI:

```bash
python scripts/cli.py data/scripts/the_ledger_v1.fountain > report.md
```

Two sample screenplays ship in `data/scripts/`: *The Ledger* (a Boston legal thriller, first draft and a revision with renamed characters) and *Golden Hour* (an LA wedding-photographer story). Both are original and seeded with the kinds of references that trip clearance: common professional names in a named city, real brands, real song titles, plausible addresses.

## Deploy to Cloud Run

```bash
PROJECT=your-project REGION=us-central1 ./scripts/deploy.sh
```

The script enables the APIs, stores the Parallel key in Secret Manager, creates a Firestore database, grants the Cloud Run service account Vertex AI / Firestore / Secret Manager access, and deploys from source. Gemini runs through Vertex AI (`GOOGLE_GENAI_USE_VERTEXAI=true`).

## API

| Method | Path | |
|---|---|---|
| `POST` | `/api/jobs` | `file` (pdf/txt/fountain), `text`, or `sample` |
| `POST` | `/api/jobs/{id}/revise` | same body; diffs against the parent job |
| `GET` | `/api/jobs/{id}` | job state, items, verdicts, alternatives |
| `GET` | `/api/jobs/{id}/events` | server-sent events while the pipeline runs |
| `GET` | `/api/jobs/{id}/report.md` | exportable report |

## Configuration

| Variable | Default | |
|---|---|---|
| `EXTRACT_MODEL` / `JUDGE_MODEL` / `REPORT_MODEL` | `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-2.5-pro` | |
| `PARALLEL_SEARCH_MODE` | `fast` | `turbo`, `fast`, `basic`, `advanced` |
| `MAX_ITEMS` | `120` | cost guard per draft |
| `RESEARCH_CONCURRENCY` / `JUDGE_CONCURRENCY` | `4` / `6` | |
| `STORE` | `memory` | `firestore` for persistence |

## The business

Clearance is a mandatory purchase — distributors require E&O insurance, and E&O underwriters require a clearance report — yet the reports are still produced by hand by a few boutique shops at $1,000–$5,000+ per feature. Clearance Desk sells two ways off one pipeline: as a copilot for clearance houses and studio legal (they review instead of research, and still sign the report), and as a $99 draft-stage first pass for the indie and creator long tail that can't afford a report today. Roughly 80 professional teams at ~$1k/month plus 15–20k self-serve drafts a year is a low-single-digit-millions ARR business on the core product, before extending the same pipeline to chain-of-title, music rights, and product-placement leads.

## What we learned

- Extraction quality is the whole game. Asking for *how the script portrays* each item (profession, city, negative portrayal) is what lets the judge tell a harmless namesake from a defamation risk — and it's what makes the search queries specific enough to be useful.
- Search must be deterministic. Early versions let the model write its own queries; results drifted between runs and the revision diff became meaningless. Templated queries fixed both.
- Verifying replacements is the feature people actually want. A list of conflicts is a problem; a list of conflicts with clean, pre-checked alternatives is a fix.

## License

MIT — see `LICENSE`.
