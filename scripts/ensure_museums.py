#!/usr/bin/env python3
"""장소 이름이 museums에 있으면 exhibition.museum_id를 붙이고, 없으면 상세 정보와 함께 추가한다."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict

from exhibition_sync_filters import END_DATE_MIN, _normalize, clean_exhibition_text
from fill_museum_details import fill_empty_museum_fields, fill_from_kakao, names_match

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

SKIP_VENUE_NAMES = frozenset({"", "장소 정보 없음"})
SKIP_VENUE_SUBSTRINGS = ("온라인",)
SAME_ADDRESS_MULTI_VENUE_HINTS = ("예술의전당", "예술의 전당")


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def venue_name_allowed(name: str) -> bool:
    cleaned = clean_exhibition_text(name)
    if _normalize(cleaned) in {_normalize(s) for s in SKIP_VENUE_NAMES}:
        return False
    if len(_normalize(cleaned)) < 2:
        return False
    return not any(s in cleaned for s in SKIP_VENUE_SUBSTRINGS)


def sb_get(path: str, base: str, key: str) -> list:
    req = urllib.request.Request(f"{base}{path}")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def sb_request(method: str, path: str, base: str, key: str, body=None, prefer: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{base}{path}", data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        return resp.status, json.loads(raw.decode()) if raw else None


def _museum_index(museums: list[dict]) -> dict[str, int]:
    index: dict[str, int] = {}
    for row in museums:
        mid = row.get("id")
        if mid is None:
            continue
        for raw in (row.get("name"), row.get("venue_group_name")):
            key = _normalize(raw or "")
            if key and key not in index:
                index[key] = mid
    return index


def _venue_tokens(value: str) -> set[str]:
    text = clean_exhibition_text(value)
    tokens = [part for part in re.split(r"[\s()/·,._-]+", text) if part]
    return {token for token in tokens if len(_normalize(token)) >= 2}


def _venue_norm(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]+", "", _normalize(clean_exhibition_text(value)))


def _venue_matches(left: str, right: str) -> bool:
    if names_match(left, right):
        return True
    left_norm = _venue_norm(left)
    right_norm = _venue_norm(right)
    if left_norm and right_norm and (left_norm in right_norm or right_norm in left_norm):
        return min(len(left_norm), len(right_norm)) >= 4

    left_tokens = _venue_tokens(left)
    right_tokens = _venue_tokens(right)
    if not left_tokens or not right_tokens:
        return False
    smaller, larger = (
        (left_tokens, right_tokens)
        if len(left_tokens) <= len(right_tokens)
        else (right_tokens, left_tokens)
    )
    return len(smaller) >= 2 and smaller.issubset(larger)


def _matching_museum_id(museums: list[dict], venue_name: str) -> int | None:
    for row in museums:
        mid = row.get("id")
        if mid is None:
            continue
        for raw in (row.get("name"), row.get("venue_group_name")):
            if raw and _venue_matches(venue_name, raw):
                return mid
    return None


def _same_address_allowed(name: str) -> bool:
    return any(hint in name for hint in SAME_ADDRESS_MULTI_VENUE_HINTS)


def _address_exists(museums: list[dict], address: str, name: str) -> int | None:
    address_norm = _normalize(address)
    if not address_norm or _same_address_allowed(name):
        return None
    for row in museums:
        row_address = row.get("address") or ""
        if row_address and _normalize(row_address) == address_norm:
            return row.get("id")
    return None


def _insert_museum(base: str, key: str, body: dict) -> int | None:
    name = body.get("name", "")
    try:
        status, rows = sb_request(
            "POST",
            "/rest/v1/museums",
            base,
            key,
            [body],
            prefer="return=representation",
        )
    except urllib.error.HTTPError as e:
        print(f"  museum insert failed {name[:40]}: {e.code} {e.read().decode(errors='replace')[:160]}", file=sys.stderr)
        return None
    if status not in (200, 201) or not rows:
        return None
    return rows[0].get("id")


def _link_exhibitions(base: str, key: str, museum_id: int, rows: list[dict]) -> int:
    ids = [str(r["id"]) for r in rows if r.get("museum_id") != museum_id]
    if not ids:
        return 0
    try:
        sb_request(
            "PATCH",
            f"/rest/v1/exhibitions?id=in.({','.join(ids)})",
            base,
            key,
            {"museum_id": museum_id},
            prefer="return=minimal",
        )
        return len(ids)
    except urllib.error.HTTPError as e:
        print(f"  link failed museum_id={museum_id}: {e.code}", file=sys.stderr)
        return 0


def clear_name_only_coords(base: str, key: str) -> int:
    """주소·전화·홈페이지가 없는 자동 추가 행에서 채워 둔 좌표만 비운다."""
    rows = sb_get(
        "/rest/v1/museums?select=id,address,phone,homepage_url,gps_x"
        "&address=is.null&phone=is.null&homepage_url=is.null&gps_x=not.is.null&limit=2000",
        base,
        key,
    )
    cleared = 0
    for row in rows:
        try:
            sb_request(
                "PATCH",
                f"/rest/v1/museums?id=eq.{row['id']}",
                base,
                key,
                {"gps_x": None, "gps_y": None, "synced_at": None},
                prefer="return=minimal",
            )
            cleared += 1
        except urllib.error.HTTPError as e:
            print(f"  clear gps failed id={row['id']}: {e.code}", file=sys.stderr)
    return cleared


def ensure_museums_from_exhibitions(
    base: str,
    key: str,
    env: dict[str, str] | None = None,
) -> tuple[int, int]:
    """이름/유사 이름 일치 → link. 새 장소는 address/gps 확보 후 insert. (created, linked)"""
    env = env or load_env()
    kakao_key = env.get("KAKAO_API_KEY") or env.get("EXPO_PUBLIC_KAKAO_API_KEY") or ""
    exhibitions = sb_get(
        "/rest/v1/exhibitions?select=id,venue_name_fallback,museum_id"
        f"&end_date=gte.{END_DATE_MIN}&limit=2000",
        base,
        key,
    )
    museums = sb_get(
        "/rest/v1/museums?select=id,name,venue_group_name,address&limit=10000",
        base,
        key,
    )
    index = _museum_index(museums)
    by_venue: dict[str, list[dict]] = defaultdict(list)
    for row in exhibitions:
        name = clean_exhibition_text(row.get("venue_name_fallback") or "")
        if not venue_name_allowed(name):
            continue
        by_venue[name].append(row)

    created = 0
    linked = 0
    for name, rows in by_venue.items():
        mid = index.get(_normalize(name))
        if mid is None:
            mid = _matching_museum_id(museums, name)
        if mid is not None:
            linked += _link_exhibitions(base, key, mid, rows)
            continue

        if not kakao_key:
            print(f"  skip museum {name}: KAKAO_API_KEY missing", file=sys.stderr)
            continue
        patch = fill_from_kakao(name, kakao_key)
        address = patch.get("address")
        gps_x = patch.get("gps_x")
        gps_y = patch.get("gps_y")
        if not address or not gps_x or not gps_y:
            print(f"  skip museum {name}: address/gps not found", file=sys.stderr)
            continue
        duplicate_address_mid = _address_exists(museums, address, name)
        if duplicate_address_mid is not None:
            linked += _link_exhibitions(base, key, duplicate_address_mid, rows)
            print(f"  = museum {name}: same address as museum_id={duplicate_address_mid}", file=sys.stderr)
            continue

        body = {"name": name, **patch}
        new_mid = _insert_museum(base, key, body)
        if new_mid is None:
            continue
        created += 1
        museums.append({"id": new_mid, "name": name, "venue_group_name": None, "address": address})
        index[_normalize(name)] = new_mid
        linked += _link_exhibitions(base, key, new_mid, rows)
        print(f"  + museum {name}: {address}", file=sys.stderr)
    return created, linked


def main() -> None:
    env = load_env()
    base = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not base or not key:
        print("Need EXPO_PUBLIC_SUPABASE_URL and a Supabase key", file=sys.stderr)
        sys.exit(1)
    created, linked = ensure_museums_from_exhibitions(base, key, env)
    stats = fill_empty_museum_fields(base, key, env)
    print(
        f"museums created {created}, exhibitions linked {linked}, "
        f"details filled {stats['updated']}"
    )


if __name__ == "__main__":
    main()
