"""Typed schemas shared by the extraction, research, judgment and remediation stages.

Every stage reads and writes these models through ADK session state, so the
pipeline is deterministic: the same script produces the same item list, the
same research queries, and a report that can be diffed against the next draft.
"""
from __future__ import annotations

import hashlib
import re
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Category(str, Enum):
    PERSON = "person"            # character names
    BUSINESS = "business"        # fictional companies, bars, law firms
    BRAND = "brand"              # products, trademarks seen or spoken
    TITLE = "title"              # songs, books, films, TV shows referenced
    LOCATION = "location"        # real-looking addresses, buildings, venues
    IDENTIFIER = "identifier"    # phone numbers, plates, URLs, account numbers
    ORGANIZATION = "organization"  # agencies, schools, hospitals, teams


class Risk(str, Enum):
    CLEAR = "clear"
    CAUTION = "caution"
    CONFLICT = "conflict"
    PENDING = "pending"


class Item(BaseModel):
    """One clearance-sensitive element found in the screenplay."""

    text: str = Field(description="The exact name or reference as written in the script")
    category: Category
    scene: str = Field(description="Scene heading (slugline) where it first appears")
    page: int = Field(description="Approximate page number of first appearance")
    context: str = Field(
        description="One or two sentences describing how the script portrays it: profession, "
        "city, role in story, and whether the portrayal is negative (crime, incompetence, etc.)"
    )
    occurrences: int = Field(default=1, description="How many times it appears")

    @property
    def key(self) -> str:
        norm = re.sub(r"[^a-z0-9]+", " ", self.text.lower()).strip()
        return f"{self.category.value}:{norm}"


class ExtractionResult(BaseModel):
    title: str = Field(description="Working title of the screenplay")
    logline: str = Field(description="One sentence summary of the story")
    setting: str = Field(description="Primary city / region and era the story takes place in")
    items: List[Item]


class Match(BaseModel):
    url: str
    title: str = ""
    why: str = Field(description="Why this real-world entity could be confused with the scripted one")


class Verdict(BaseModel):
    risk: Risk
    reasoning: str = Field(description="Two to four sentences a clearance attorney would write")
    matches: List[Match] = Field(default_factory=list)
    recommendation: str = Field(
        default="", description="Change / keep with release / keep — and what to do about it"
    )


class Evidence(BaseModel):
    """Raw research output kept alongside the verdict so judges and lawyers can audit it."""

    queries: List[str]
    results: List[dict]  # {url, title, excerpt}
    search_id: Optional[str] = None


class Alternative(BaseModel):
    text: str
    verified: bool = False
    note: str = ""


class ClearedItem(BaseModel):
    item: Item
    evidence: Optional[Evidence] = None
    verdict: Optional[Verdict] = None
    alternatives: List[Alternative] = Field(default_factory=list)
    reused_from_previous_draft: bool = False

    @property
    def key(self) -> str:
        return self.item.key


class Report(BaseModel):
    job_id: str
    script_title: str
    logline: str
    setting: str
    summary: str = ""
    items: List[ClearedItem]
    stats: dict = Field(default_factory=dict)


def fingerprint(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
