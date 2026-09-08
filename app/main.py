"""Clearance Desk API + static UI. Runs on Cloud Run.

POST /api/jobs                 upload a screenplay (pdf/txt/fountain) or paste text
POST /api/jobs/{id}/revise     upload a revised draft; unchanged items keep their verdicts
GET  /api/jobs/{id}            full job state
GET  /api/jobs/{id}/events     server-sent events while the pipeline runs
GET  /api/jobs/{id}/report.md  exportable clearance report
GET  /api/samples              bundled sample screenplays for the demo
"""
from __future__ import annotations

import asyncio
import io
import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.jobs import Job, create_job, render_report_markdown, store, subscribe, unsubscribe

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
SAMPLES = ROOT / "data" / "scripts"

app = FastAPI(title="Clearance Desk", version="1.0")


def _read_upload(upload: UploadFile, raw: bytes) -> str:
    name = (upload.filename or "").lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(raw))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    return raw.decode("utf-8", errors="replace")


async def _script_from_request(file: Optional[UploadFile], text: Optional[str], sample: Optional[str]):
    if sample:
        path = SAMPLES / sample
        if not path.exists() or path.suffix not in {".txt", ".fountain"}:
            raise HTTPException(404, "unknown sample")
        return sample, path.read_text()
    if file is not None:
        raw = await file.read()
        return file.filename or "upload", _read_upload(file, raw)
    if text and text.strip():
        return "pasted-draft", text
    raise HTTPException(400, "Provide a file, text, or sample")


@app.post("/api/jobs")
async def create(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    sample: Optional[str] = Form(None),
):
    name, script = await _script_from_request(file, text, sample)
    if len(script) < 200:
        raise HTTPException(400, "That doesn't look like a screenplay — fewer than 200 characters.")
    job = await create_job(name, script)
    return job.public()


@app.post("/api/jobs/{job_id}/revise")
async def revise(
    job_id: str,
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    sample: Optional[str] = Form(None),
):
    parent = await store.get(job_id)
    if not parent:
        raise HTTPException(404, "job not found")
    if parent.status != "done":
        raise HTTPException(409, "Previous draft is still being cleared")
    name, script = await _script_from_request(file, text, sample)
    job = await create_job(name, script, parent_id=parent.id)
    return job.public()


@app.get("/api/jobs")
async def list_jobs():
    jobs = await store.list()
    return [
        {k: v for k, v in j.public().items() if k not in {"cleared", "extraction"}}
        | {"title": (j.extraction or {}).get("title")}
        for j in jobs
    ]


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    job = await store.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return job.public()


@app.get("/api/jobs/{job_id}/events")
async def events(job_id: str):
    job = await store.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")

    async def gen():
        q = subscribe(job_id)
        try:
            # replay what already happened, then live-tail
            yield f"data: {json.dumps({'kind': 'snapshot', 'job': job.public()})}\n\n"
            if job.status in {"done", "error"}:
                return
            while True:
                try:
                    evt = await asyncio.wait_for(q.get(), timeout=20)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue
                yield f"data: {json.dumps(evt)}\n\n"
                if evt["kind"] in {"done", "error"}:
                    return
        finally:
            unsubscribe(job_id, q)

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.get("/api/jobs/{job_id}/report.md")
async def report(job_id: str):
    job = await store.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return PlainTextResponse(render_report_markdown(job), media_type="text/markdown")


@app.get("/api/samples")
async def samples():
    out = []
    for p in sorted(SAMPLES.glob("*.txt")) + sorted(SAMPLES.glob("*.fountain")):
        first = p.read_text().strip().splitlines()[0] if p.stat().st_size else p.name
        out.append({"file": p.name, "title": first.strip()})
    return out


@app.get("/healthz")
async def healthz():
    return {"ok": True, "parallel": bool(os.environ.get("PARALLEL_API_KEY"))}


@app.get("/", response_class=HTMLResponse)
async def index():
    return FileResponse(WEB / "index.html")


app.mount("/static", StaticFiles(directory=WEB), name="static")
