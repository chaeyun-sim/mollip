"""Shared filters for exhibition sync scripts (culture, kcisa_moca, sac)."""
from __future__ import annotations

import re

# 2026-08-01(서비스 기준) 이전에 종료한 전시는 적재하지 않음. end_date >= 이 값만.
END_DATE_MIN = "2026.08.01"

VENUE_EXACT_BLOCKLIST: frozenset[str] = frozenset(
    {
        "현대어린이책미술관",
        "증평민속체험미술관",
        "수목원테마파크",
    }
)

VENUE_SUBSTRING_BLOCKLIST: tuple[str, ...] = (
    "어린이책미술",
    "어린이미술관",
    "어린이박물관",
    "민속체험미술",
    "민속체험박물",
    "테마파크",
    "체험형전시",
)

_VENUE_TITLE_PATTERN = re.compile(
    r"(5\s*d|3\s*d|\bvr\b|가상현실|테마\s*파크)",
    re.IGNORECASE,
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", "", text or "").strip()


VENUE_EXACT_NORM: frozenset[str] = frozenset(_normalize(v) for v in VENUE_EXACT_BLOCKLIST)


def end_date_eligible(end_date: str) -> bool:
    """end_date format: YYYY.MM.DD"""
    if len(end_date) != 10 or end_date[4] != "." or end_date[7] != ".":
        return False
    return end_date >= END_DATE_MIN


def venue_sync_allowed(venue: str, title: str = "") -> bool:
    """False → sync/update from API skip."""
    if _normalize(venue) in VENUE_EXACT_NORM:
        return False
    hay = f"{venue} {title}"
    hay_norm = _normalize(hay)
    for needle in VENUE_SUBSTRING_BLOCKLIST:
        if _normalize(needle) in hay_norm:
            return False
    if _VENUE_TITLE_PATTERN.search(hay):
        return False
    return True
