"""Clearance Desk agent network, built on Google ADK.

    ScriptClearance (SequentialAgent)
      ├── extractor   LlmAgent   Gemini reads the screenplay → typed item list
      ├── researcher  BaseAgent  deterministic fan-out to Parallel Search API
      ├── judge       BaseAgent  Gemini scores each item against its evidence
      ├── remediator  BaseAgent  proposes replacement names, re-verifies via Parallel
      └── reporter    LlmAgent   Gemini writes the clearance memo summary

State keys written along the way:
    script_text, previous (optional) → extraction → cleared → summary
"""
from __future__ import annotations

import asyncio
import json
import os
from typing import AsyncGenerator, Awaitable, Callable, List, Optional

from google.adk.agents import BaseAgent, LlmAgent, SequentialAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.genai import Client, types

from .models import (
    Alternative,
    Category,
    ClearedItem,
    Evidence,
    ExtractionResult,
    Item,
    Risk,
    Verdict,
)
from .research import research_item

Progress = Callable[[str, dict], Awaitable[None]]

EXTRACT_MODEL = os.environ.get("EXTRACT_MODEL", "gemini-2.5-pro")
JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "gemini-2.5-flash")
REPORT_MODEL = os.environ.get("REPORT_MODEL", "gemini-2.5-pro")
MAX_ITEMS = int(os.environ.get("MAX_ITEMS", "120"))
JUDGE_CONCURRENCY = int(os.environ.get("JUDGE_CONCURRENCY", "6"))
RESEARCH_CONCURRENCY = int(os.environ.get("RESEARCH_CONCURRENCY", "4"))

_genai: Client | None = None


def genai() -> Client:
    global _genai
    if _genai is None:
        _genai = Client()  # reads GOOGLE_API_KEY or Vertex env vars
    return _genai


def _state_event(agent: BaseAgent, ctx: InvocationContext, delta: dict, text: str = "") -> Event:
    return Event(
        author=agent.name,
        invocation_id=ctx.invocation_id,
        content=types.Content(role="model", parts=[types.Part(text=text)]) if text else None,
        actions=EventActions(state_delta=delta),
    )


# --------------------------------------------------------------------------- #
# 1. Extraction — LlmAgent with a strict output schema
# --------------------------------------------------------------------------- #

EXTRACT_INSTRUCTION = """You are a script clearance coordinator at a film studio.

Read the screenplay below and list every element a clearance attorney must check
before production. Be exhaustive — missing one costs more than an extra row.

Include:
- person: every named character (first and last name if given). Note profession, city,
  and whether the portrayal is negative (criminal, incompetent, unethical, sexual).
- business: fictional companies, law firms, bars, restaurants, shops, clinics.
- brand: any product, vehicle model, drink, device, clothing label mentioned or seen.
- title: songs (lyrics or titles), books, films, TV shows, newspapers, magazines.
- location: specific street addresses, named buildings, hotels, venues.
- identifier: phone numbers, license plates, URLs, email addresses, account numbers.
- organization: schools, hospitals, agencies, sports teams, charities, government units.

Rules:
- Use the exact spelling from the script for `text`.
- Give the first scene heading and an approximate page (assume ~55 lines per page).
- `context` must say how the script uses it, in one or two sentences, including
  city/profession for people and businesses and whether the portrayal is negative.
- Do not include generic words (a bar, a phone) — only named or specific things.
- Do not include the writer's name or title page credits.

SCREENPLAY:
{script_text}
"""

def make_extractor() -> LlmAgent:
  return LlmAgent(
    name="extractor",
    model=EXTRACT_MODEL,
    description="Reads the screenplay and lists every clearance-sensitive element.",
    instruction=EXTRACT_INSTRUCTION,
    output_schema=ExtractionResult,
    output_key="extraction",
    include_contents="none",
    generate_content_config=types.GenerateContentConfig(temperature=0.0),
  )


# --------------------------------------------------------------------------- #
# 2. Research — deterministic fan-out to the Parallel Search API
# --------------------------------------------------------------------------- #


class ResearchAgent(BaseAgent):
    """Runs Parallel Search for every item. No LLM involved: this stage is reproducible."""

    progress: Optional[Progress] = None

    model_config = {"arbitrary_types_allowed": True}

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        extraction = ExtractionResult.model_validate(ctx.session.state["extraction"])
        previous: dict = ctx.session.state.get("previous") or {}
        items = extraction.items[:MAX_ITEMS]

        cleared: List[ClearedItem] = []
        reused = 0
        for it in items:
            prev = previous.get(it.key)
            if prev and prev.get("verdict"):
                ci = ClearedItem.model_validate(prev)
                ci.item = it
                ci.reused_from_previous_draft = True
                cleared.append(ci)
                reused += 1
            else:
                cleared.append(ClearedItem(item=it))

        if self.progress:
            await self.progress(
                "extracted",
                {
                    "title": extraction.title,
                    "logline": extraction.logline,
                    "setting": extraction.setting,
                    "items": [c.model_dump(mode="json") for c in cleared],
                    "reused": reused,
                },
            )

        sem = asyncio.Semaphore(RESEARCH_CONCURRENCY)

        async def one(idx: int, ci: ClearedItem):
            if ci.reused_from_previous_draft:
                return
            async with sem:
                try:
                    ev = await asyncio.to_thread(research_item, ci.item, extraction.setting)
                except Exception as e:  # keep going; the judge will see empty evidence
                    ev = Evidence(queries=[], results=[], search_id=None)
                    ev.results.append({"url": "", "title": "search error", "excerpt": str(e)})
                ci.evidence = ev
                if self.progress:
                    await self.progress("researched", {"index": idx, "evidence": ev.model_dump()})

        await asyncio.gather(*(one(i, c) for i, c in enumerate(cleared)))

        delta = {"cleared": [c.model_dump(mode="json") for c in cleared]}
        yield _state_event(self, ctx, delta, f"Researched {len(cleared)} items via Parallel Search")


# --------------------------------------------------------------------------- #
# 3. Judgment — Gemini scores each item against its evidence
# --------------------------------------------------------------------------- #

JUDGE_PROMPT = """You are a script clearance attorney. Decide the clearance risk for one element.

Screenplay: {title}
Setting: {setting}
Element: {text}  (category: {category})
How the script uses it: {context}

Web research (from Parallel Search):
{evidence}

Risk scale:
- conflict: a real, identifiable person/business/brand/work matches closely enough that the
  producer could face defamation, trademark, or copyright exposure. For people, a real person
  with the same name in the same profession or city, especially with a negative portrayal.
  For brands/titles/songs, any real protected work or mark used without a license.
- caution: partial overlap (same name, different field; common name with many people;
  brand mentioned neutrally in passing) — usable with a release, a disclaimer, or minor change.
- clear: no meaningful real-world overlap found, or the reference is generic / de minimis.

Write the reasoning the way it would appear in a clearance report: specific, cite what was
found, say why it does or does not matter. List only the matches that drive the risk.
Give a one-line recommendation: change it / obtain a license or release / keep.
"""


def _fmt_evidence(ev: Evidence | None) -> str:
    if not ev or not ev.results:
        return "(no results)"
    out = []
    for r in ev.results[:8]:
        out.append(f"- {r.get('title','')} — {r.get('url','')}\n  {r.get('excerpt','')}")
    return "\n".join(out)


async def judge_one(ci: ClearedItem, title: str, setting: str) -> Verdict:
    prompt = JUDGE_PROMPT.format(
        title=title,
        setting=setting,
        text=ci.item.text,
        category=ci.item.category.value,
        context=ci.item.context,
        evidence=_fmt_evidence(ci.evidence),
    )
    resp = await genai().aio.models.generate_content(
        model=JUDGE_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.0,
            response_mime_type="application/json",
            response_schema=Verdict,
        ),
    )
    return Verdict.model_validate_json(resp.text)


class JudgeAgent(BaseAgent):
    progress: Optional[Progress] = None
    model_config = {"arbitrary_types_allowed": True}

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        extraction = ExtractionResult.model_validate(ctx.session.state["extraction"])
        cleared = [ClearedItem.model_validate(c) for c in ctx.session.state["cleared"]]
        sem = asyncio.Semaphore(JUDGE_CONCURRENCY)

        async def one(idx: int, ci: ClearedItem):
            if ci.reused_from_previous_draft and ci.verdict:
                return
            async with sem:
                try:
                    ci.verdict = await judge_one(ci, extraction.title, extraction.setting)
                except Exception as e:
                    ci.verdict = Verdict(risk=Risk.CAUTION, reasoning=f"Judgment failed: {e}", matches=[])
                if self.progress:
                    await self.progress("judged", {"index": idx, "verdict": ci.verdict.model_dump(mode="json")})

        await asyncio.gather(*(one(i, c) for i, c in enumerate(cleared)))
        delta = {"cleared": [c.model_dump(mode="json") for c in cleared]}
        counts = {r.value: sum(1 for c in cleared if c.verdict and c.verdict.risk == r) for r in Risk}
        yield _state_event(self, ctx, delta, f"Judged items: {json.dumps(counts)}")


# --------------------------------------------------------------------------- #
# 4. Remediation — propose alternatives and verify them with Parallel again
# --------------------------------------------------------------------------- #

ALT_PROMPT = """A screenplay element has a clearance conflict and must be renamed.

Element: {text} (category: {category})
Script context: {context}
Setting: {setting}
Why it conflicts: {reasoning}

Propose 3 replacement names that keep the same feel (ethnicity, era, syllable count, tone)
and fit the setting. Prefer combinations that are unusual enough to be unlikely to match a
real person or business. Return JSON: {{"alternatives": ["...", "...", "..."]}}
"""


async def propose_alternatives(ci: ClearedItem, setting: str) -> List[str]:
    prompt = ALT_PROMPT.format(
        text=ci.item.text,
        category=ci.item.category.value,
        context=ci.item.context,
        setting=setting,
        reasoning=ci.verdict.reasoning if ci.verdict else "",
    )
    resp = await genai().aio.models.generate_content(
        model=JUDGE_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.7, response_mime_type="application/json"),
    )
    data = json.loads(resp.text)
    return [a for a in data.get("alternatives", []) if isinstance(a, str)][:3]


class RemediateAgent(BaseAgent):
    progress: Optional[Progress] = None
    model_config = {"arbitrary_types_allowed": True}

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        extraction = ExtractionResult.model_validate(ctx.session.state["extraction"])
        cleared = [ClearedItem.model_validate(c) for c in ctx.session.state["cleared"]]
        remediable = {Category.PERSON, Category.BUSINESS, Category.ORGANIZATION}
        targets = [
            (i, c)
            for i, c in enumerate(cleared)
            if c.verdict
            and c.verdict.risk == Risk.CONFLICT
            and c.item.category in remediable
            and not c.alternatives
        ]
        sem = asyncio.Semaphore(RESEARCH_CONCURRENCY)

        async def one(idx: int, ci: ClearedItem):
            async with sem:
                try:
                    names = await propose_alternatives(ci, extraction.setting)
                except Exception:
                    names = []
                alts: List[Alternative] = []
                for name in names:
                    trial = ClearedItem(item=ci.item.model_copy(update={"text": name}))
                    try:
                        trial.evidence = await asyncio.to_thread(
                            research_item, trial.item, extraction.setting
                        )
                        v = await judge_one(trial, extraction.title, extraction.setting)
                        alts.append(
                            Alternative(
                                text=name,
                                verified=v.risk == Risk.CLEAR,
                                note=v.reasoning[:240],
                            )
                        )
                    except Exception as e:
                        alts.append(Alternative(text=name, verified=False, note=f"not verified: {e}"))
                ci.alternatives = alts
                if self.progress:
                    await self.progress(
                        "remediated", {"index": idx, "alternatives": [a.model_dump() for a in alts]}
                    )

        await asyncio.gather(*(one(i, c) for i, c in targets))
        delta = {"cleared": [c.model_dump(mode="json") for c in cleared]}
        yield _state_event(self, ctx, delta, f"Proposed alternatives for {len(targets)} conflicts")


# --------------------------------------------------------------------------- #
# 5. Report — Gemini writes the memo summary from the verdicts
# --------------------------------------------------------------------------- #

REPORT_INSTRUCTION = """You are writing the summary paragraph of a script clearance report.

Screenplay: {extraction}

Verdicts (JSON): {cleared}

Write 120-180 words, in the voice of a clearance attorney addressing the producer:
what the overall exposure is, which elements must change before the shooting script is
locked, which need releases or licenses, and what is fine. Name the specific elements.
Plain prose, no headings, no bullet points.
"""

def make_reporter() -> LlmAgent:
  return LlmAgent(
    name="reporter",
    model=REPORT_MODEL,
    description="Writes the executive summary of the clearance report.",
    instruction=REPORT_INSTRUCTION,
    output_key="summary",
    include_contents="none",
    generate_content_config=types.GenerateContentConfig(temperature=0.2),
  )


def build_pipeline(progress: Optional[Progress] = None) -> SequentialAgent:
    return SequentialAgent(
        name="ScriptClearance",
        description="Clears a screenplay draft for names, brands, titles and locations.",
        sub_agents=[
            make_extractor(),
            ResearchAgent(name="researcher", description="Parallel Search fan-out", progress=progress),
            JudgeAgent(name="judge", description="Risk scoring", progress=progress),
            RemediateAgent(name="remediator", description="Replacement names", progress=progress),
            make_reporter(),
        ],
    )
