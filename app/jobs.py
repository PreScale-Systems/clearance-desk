"""Job lifecycle: create, run the ADK pipeline, stream progress, persist results.

Persistence backends:
  memory     — default; fine for a single Cloud Run instance / local dev
  firestore  — set STORE=firestore; jobs survive restarts and scale-out
"""
from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from google.adk.runners import InMemoryRunner
from google.genai import types

from agent.models import ClearedItem, ExtractionResult, Report, Risk, fingerprint
from agent.pipeline import build_pipeline

APP_NAME = "clearance-desk"


@dataclass
class Job:
    id: str
    script_name: str
    script_text: str
    status: str = "queued"  # queued | extracting | researching | judging | remediating | reporting | done | error
    created_at: float = field(default_factory=time.time)
    finished_at: Optional[float] = None
    error: Optional[str] = None
    parent_id: Optional[str] = None  # set when this job is a revision of another
    extraction: Optional[dict] = None
    cleared: List[dict] = field(default_factory=list)
    summary: str = ""
    events: List[dict] = field(default_factory=list)
    reused: int = 0

    def public(self) -> dict:
        counts = {r.value: 0 for r in Risk}
        for c in self.cleared:
            v = c.get("verdict")
            if v:
                counts[v["risk"]] += 1
            else:
                counts["pending"] += 1
        return {
            "id": self.id,
            "script_name": self.script_name,
            "status": self.status,
            "created_at": self.created_at,
            "finished_at": self.finished_at,
            "error": self.error,
            "parent_id": self.parent_id,
            "extraction": self.extraction,
            "cleared": self.cleared,
            "summary": self.summary,
            "counts": counts,
            "reused": self.reused,
            "fingerprint": fingerprint(self.script_text),
            "script_text": self.script_text,
        }


# --------------------------------------------------------------------------- #
# Store
# --------------------------------------------------------------------------- #


class MemoryStore:
    def __init__(self) -> None:
        self.jobs: Dict[str, Job] = {}

    async def save(self, job: Job) -> None:
        self.jobs[job.id] = job

    async def get(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    async def list(self) -> List[Job]:
        return sorted(self.jobs.values(), key=lambda j: -j.created_at)


class FirestoreStore(MemoryStore):
    """Write-through to Firestore; memory cache keeps the SSE stream fast."""

    def __init__(self) -> None:
        super().__init__()
        from google.cloud import firestore  # imported lazily so local dev needs no GCP libs

        self.db = firestore.AsyncClient()
        self.col = self.db.collection(os.environ.get("FIRESTORE_COLLECTION", "clearance_jobs"))

    async def save(self, job: Job) -> None:
        await super().save(job)
        doc = {k: v for k, v in job.__dict__.items() if k != "events"}
        await self.col.document(job.id).set(doc)

    async def get(self, job_id: str) -> Optional[Job]:
        job = await super().get(job_id)
        if job:
            return job
        snap = await self.col.document(job_id).get()
        if not snap.exists:
            return None
        job = Job(**snap.to_dict())
        self.jobs[job.id] = job
        return job

    async def list(self) -> List[Job]:
        out = []
        async for snap in self.col.order_by("created_at", direction="DESCENDING").limit(50).stream():
            out.append(Job(**snap.to_dict()))
        return out


def make_store():
    return FirestoreStore() if os.environ.get("STORE") == "firestore" else MemoryStore()


store = make_store()

# --------------------------------------------------------------------------- #
# Runner
# --------------------------------------------------------------------------- #

_subscribers: Dict[str, List[asyncio.Queue]] = {}


def subscribe(job_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(job_id, []).append(q)
    return q


def unsubscribe(job_id: str, q: asyncio.Queue) -> None:
    subs = _subscribers.get(job_id, [])
    if q in subs:
        subs.remove(q)


async def _emit(job: Job, kind: str, data: dict) -> None:
    evt = {"kind": kind, "t": time.time(), **data}
    job.events.append(evt)
    for q in _subscribers.get(job.id, []):
        await q.put(evt)


STAGES = ["queued", "extracting", "researching", "judging", "remediating", "reporting", "done", "error"]
STAGE_BY_EVENT = {
    "extracted": "researching",
    "researched": "researching",
    "judged": "judging",
    "remediated": "remediating",
}


async def run_job(job: Job) -> None:
    """Runs the ADK pipeline for one job and mirrors progress into the job record."""

    async def progress(kind: str, data: dict) -> None:
        if kind == "extracted":
            job.extraction = {
                "title": data["title"],
                "logline": data["logline"],
                "setting": data["setting"],
            }
            job.cleared = data["items"]
            job.reused = data.get("reused", 0)
        elif kind == "researched":
            job.cleared[data["index"]]["evidence"] = data["evidence"]
        elif kind == "judged":
            job.cleared[data["index"]]["verdict"] = data["verdict"]
        elif kind == "remediated":
            job.cleared[data["index"]]["alternatives"] = data["alternatives"]
        # statuses only move forward
        nxt = STAGE_BY_EVENT.get(kind)
        if nxt and STAGES.index(nxt) > STAGES.index(job.status):
            job.status = nxt
        await store.save(job)
        await _emit(job, kind, {"index": data.get("index"), "status": job.status, "counts": job.public()["counts"]})

    try:
        job.status = "extracting"
        await store.save(job)
        await _emit(job, "status", {"status": job.status})

        initial_state: Dict[str, Any] = {"script_text": job.script_text}
        if job.parent_id:
            parent = await store.get(job.parent_id)
            if parent:
                initial_state["previous"] = {
                    ClearedItem.model_validate(c).key: c for c in parent.cleared if c.get("verdict")
                }

        runner = InMemoryRunner(agent=build_pipeline(progress), app_name=APP_NAME)
        session = await runner.session_service.create_session(
            app_name=APP_NAME, user_id="studio", state=initial_state
        )
        msg = types.Content(role="user", parts=[types.Part(text="Clear this screenplay draft.")])

        async for event in runner.run_async(user_id="studio", session_id=session.id, new_message=msg):
            if event.author == "extractor" and event.actions and event.actions.state_delta.get("extraction"):
                job.status = "researching"
                await _emit(job, "status", {"status": job.status})
            if event.author == "judge" and not event.partial:
                job.status = "remediating"
                await _emit(job, "status", {"status": job.status})
            if event.author == "remediator" and not event.partial:
                job.status = "reporting"
                await _emit(job, "status", {"status": job.status})

        final = await runner.session_service.get_session(
            app_name=APP_NAME, user_id="studio", session_id=session.id
        )
        state = final.state
        job.cleared = state.get("cleared", job.cleared)
        job.summary = (state.get("summary") or "").strip()
        ex = state.get("extraction")
        if ex:
            job.extraction = {k: ex[k] for k in ("title", "logline", "setting")}
        job.status = "done"
        job.finished_at = time.time()
        await store.save(job)
        await _emit(job, "done", {"status": "done", "counts": job.public()["counts"]})
    except Exception as e:  # surface the failure in the UI instead of a silent hang
        job.status = "error"
        job.error = f"{type(e).__name__}: {e}"
        job.finished_at = time.time()
        await store.save(job)
        await _emit(job, "error", {"status": "error", "error": job.error})


async def create_job(script_name: str, script_text: str, parent_id: Optional[str] = None) -> Job:
    job = Job(id=uuid.uuid4().hex[:12], script_name=script_name, script_text=script_text, parent_id=parent_id)
    await store.save(job)
    asyncio.create_task(run_job(job))
    return job


def render_report_markdown(job: Job) -> str:
    """Deterministic markdown rendering of the full report for export."""
    ex = job.extraction or {}
    lines = [
        f"# Script clearance report — {ex.get('title', job.script_name)}",
        "",
        f"Draft: {job.script_name}  ·  Job {job.id}  ·  Fingerprint {fingerprint(job.script_text)}",
        "",
        f"**Logline.** {ex.get('logline','')}",
        "",
        f"**Setting.** {ex.get('setting','')}",
        "",
        "## Summary",
        "",
        job.summary or "_(pending)_",
        "",
        "## Items",
        "",
        "| Risk | Element | Category | Scene | Page | Recommendation |",
        "|---|---|---|---|---|---|",
    ]
    order = {"conflict": 0, "caution": 1, "clear": 2, "pending": 3}
    rows = sorted(job.cleared, key=lambda c: order.get((c.get("verdict") or {}).get("risk", "pending"), 3))
    for c in rows:
        v = c.get("verdict") or {}
        it = c["item"]
        lines.append(
            f"| {v.get('risk','pending').upper()} | {it['text']} | {it['category']} | {it['scene']} | "
            f"{it['page']} | {v.get('recommendation','')} |"
        )
    lines += ["", "## Evidence and reasoning", ""]
    for c in rows:
        v = c.get("verdict") or {}
        it = c["item"]
        lines.append(f"### {it['text']} — {v.get('risk','pending').upper()}")
        lines.append("")
        lines.append(f"_{it['context']}_")
        lines.append("")
        lines.append(v.get("reasoning", ""))
        for m in v.get("matches", []):
            lines.append(f"- {m.get('title') or m.get('url')} — {m.get('url')}  \n  {m.get('why','')}")
        if c.get("alternatives"):
            lines.append("")
            lines.append("Suggested replacements:")
            for a in c["alternatives"]:
                mark = "verified clean" if a.get("verified") else "not verified"
                lines.append(f"- **{a['text']}** ({mark})")
        if c.get("reused_from_previous_draft"):
            lines.append("")
            lines.append("_Unchanged since previous draft; verdict carried forward._")
        lines.append("")
    return "\n".join(lines)
