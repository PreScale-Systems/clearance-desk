"""Research stage: turns each extracted item into web evidence using the Parallel Search API.

This is the runtime integration with Parallel (parallel-web SDK). Queries are
built from deterministic templates per category so that the same item in the
same context always produces the same searches — which is what makes draft
diffing meaningful.
"""
from __future__ import annotations

import os
import re
from typing import List

from parallel import Parallel

from .models import Category, Evidence, Item

_client: Parallel | None = None


def client() -> Parallel:
    global _client
    if _client is None:
        key = os.environ.get("PARALLEL_API_KEY")
        if not key:
            raise RuntimeError("PARALLEL_API_KEY is not set")
        _client = Parallel(api_key=key)
    return _client


def _tokens(context: str, n: int = 4) -> str:
    """Pull the most useful qualifiers (profession, city, institution) from the context."""
    words = re.findall(r"[A-Za-z][A-Za-z'-]+", context)
    stop = {
        "the", "a", "an", "and", "of", "in", "is", "who", "as", "at", "to", "for", "with", "on",
        "her", "his", "their", "she", "he", "they", "it", "that", "this", "by", "from", "script",
        "character", "portrayed", "portrayal", "story", "scene", "appears", "shown", "named",
    }
    picked = [w for w in words if w.lower() not in stop and len(w) > 2]
    return " ".join(picked[:n])


def build_queries(item: Item, setting: str) -> tuple[list[str], str]:
    """Return (search_queries, objective) for the Parallel Search API."""
    q = item.text
    ctx = _tokens(item.context)
    city = setting.split(",")[0].strip()

    if item.category == Category.PERSON:
        queries = [f"{q} {ctx}", f"{q} {city}", f'"{q}"']
        objective = (
            f"Find real people named {q}, especially anyone who matches this description: "
            f"{item.context}. We need to know if a real person could be identified with this "
            f"fictional character."
        )
    elif item.category == Category.BUSINESS:
        queries = [f"{q} {city}", f"{q} company", f"{q} trademark"]
        objective = (
            f"Find real businesses or registered trademarks named {q}, particularly in or near "
            f"{city} or in the same line of business as: {item.context}"
        )
    elif item.category == Category.BRAND:
        queries = [f"{q} brand", f"{q} trademark owner", f"{q} product"]
        objective = f"Identify the company that owns the brand or product {q} and what it is."
    elif item.category == Category.TITLE:
        queries = [f"{q} song", f"{q} book film", f"{q} copyright"]
        objective = f"Identify the copyrighted work titled {q} (song, book, film, or show) and its rights holder."
    elif item.category == Category.LOCATION:
        queries = [f"{q} {city}", f"{q} address"]
        objective = f"Determine whether {q} is a real address, building or venue and who occupies it."
    elif item.category == Category.ORGANIZATION:
        queries = [f"{q} {city}", f"{q} organization"]
        objective = f"Find real organizations named {q}, especially in {city}."
    else:  # IDENTIFIER
        queries = [f'"{q}"', f"{q} phone number"]
        objective = f"Determine whether {q} is in real-world use (phone number, plate, URL, account)."

    return [s.strip() for s in queries if s.strip()][:3], objective


def research_item(item: Item, setting: str, max_chars: int = 6000) -> Evidence:
    queries, objective = build_queries(item, setting)
    mode = os.environ.get("PARALLEL_SEARCH_MODE", "fast")
    resp = client().search(
        search_queries=queries,
        objective=objective,
        mode=mode,
        max_chars_total=max_chars,
    )
    results: List[dict] = []
    for r in resp.results[:8]:
        results.append(
            {
                "url": r.url,
                "title": r.title or "",
                "excerpt": (r.excerpts[0] if r.excerpts else "")[:700],
                "publish_date": r.publish_date,
            }
        )
    return Evidence(queries=queries, results=results, search_id=resp.search_id)
