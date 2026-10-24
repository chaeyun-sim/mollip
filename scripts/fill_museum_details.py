#!/usr/bin/env python3
"""museums의 빈 address / phone / gps_x / gps_y / amenities만 채운다. 기존 값은 건드리지 않는다.

사용법:
  python3 scripts/fill_museum_details.py [--dry-run]

주소·전화·좌표: Kakao 키워드 검색 → 문화포털 공간정보
편의시설: 한국관광공사 무장애 여행정보
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from exhibition_sync_filters import _normalize

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
CULTURE_MUSEUM_URL = "https://apis.data.go.kr/B553457/nopenapi/rest/cultureartspaces/museum"
CULTURE_GALLERY_URL = "https://apis.data.go.kr/B553457/nopenapi/rest/cultureartspaces/artgallery"
CULTURE_DETAIL_URL = "https://apis.data.go.kr/B553457/nopenapi/rest/cultureartspaces/detail"
KTO_SEARCH_URL = "https://apis.data.go.kr/B551011/KorWithService2/searchKeyword2"
KTO_DETAIL_URL = "https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2"

_NAME_SUFFIX_RE = re.compile(r"(미술관|박물관|기념관|전시관|아트센터|아트뮤지엄|갤러리)$")
_VENUE_UNIT_RE = re.compile(r"(미술관|박물관|기념관|전시관|아트센터|아트뮤지엄|갤러리|뮤지엄)")
_PAREN_RE = re.compile(r"\([^)]*\)")
_HALL_SUFFIX_RE = re.compile(r"\s*(\d+\s*관|본관|분관|별관)$")
_KAKAO_PLACE_HINTS = ("미술관", "박물관", "기념관", "전시관", "문화시설", "갤러리")

KTO_AMENITY_LABELS = {
    "parking": "주차장",
    "restroom": "화장실",
    "wheelchair": "휠체어",
    "elevator": "엘리베이터",
    "lactationroom": "수유실",
    "stroller": "유모차대여",
    "auditorium": "강당",
}


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def _empty(value) -> bool:
    return value is None or str(value).strip() == ""


def _name_core(text: str) -> str:
    return _NAME_SUFFIX_RE.sub("", _normalize(text))


def distinctive_name(text: str) -> str:
    cleaned = _HALL_SUFFIX_RE.sub("", _PAREN_RE.sub(" ", text or "")).strip()
    parts = [p.strip() for p in re.split(r"[\s/·]+", cleaned) if p.strip()]
    for part in reversed(parts):
        if _VENUE_UNIT_RE.search(part) and len(_normalize(part)) >= 4:
            return part
    return parts[-1] if parts else cleaned


def search_queries(name: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for candidate in (
        name,
        _PAREN_RE.sub(" ", name).strip(),
        _HALL_SUFFIX_RE.sub("", name).strip(),
        distinctive_name(name),
    ):
        q = re.sub(r"\s+", " ", candidate).strip()
        if len(q) >= 2 and q not in seen:
            seen.add(q)
            out.append(q)
    return out


def names_match(left: str, right: str) -> bool:
    a, b = _normalize(left), _normalize(right)
    if not a or not b or len(a) < 2 or len(b) < 2:
        return False
    if a == b:
        return True
    if a in b or b in a:
        return min(len(a), len(b)) >= 4
    ca, cb = _name_core(left), _name_core(right)
    if ca and cb and (ca == cb or (min(len(ca), len(cb)) >= 4 and (ca in cb or cb in ca))):
        return True
    da, db = _normalize(distinctive_name(left)), _normalize(distinctive_name(right))
    return bool(da and db and len(da) >= 4 and da == db)


def sb_get(path: str, base: str, key: str) -> list:
    req = urllib.request.Request(f"{base}{path}")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def sb_patch(path: str, base: str, key: str, body: dict) -> int:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(f"{base}{path}", data=data, method="PATCH")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status


def _http_json(url: str, headers: dict[str, str] | None = None, timeout: int = 15) -> dict:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def _http_xml(url: str, timeout: int = 20) -> ET.Element | None:
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return ET.fromstring(resp.read())
    except Exception as exc:
        print(f"  [API 오류] {exc}", file=sys.stderr)
        return None


def kakao_place(name: str, api_key: str) -> dict | None:
    scored: list[tuple[int, dict]] = []
    seen_ids: set[str] = set()
    for query in search_queries(name):
        params = urllib.parse.urlencode({"query": query, "size": 5})
        req = urllib.request.Request(f"{KAKAO_KEYWORD_URL}?{params}")
        req.add_header("Authorization", f"KakaoAK {api_key}")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                docs = json.loads(resp.read()).get("documents") or []
        except Exception as exc:
            print(f"  [카카오 오류] {query}: {exc}", file=sys.stderr)
            continue
        for doc in docs:
            place_id = str(doc.get("id") or "")
            if place_id in seen_ids:
                continue
            seen_ids.add(place_id)
            place_name = doc.get("place_name") or ""
            category = f"{doc.get('category_group_name') or ''} {doc.get('category_name') or ''}"
            if not names_match(name, place_name) and not names_match(query, place_name):
                continue
            score = 2 if any(hint in category for hint in _KAKAO_PLACE_HINTS) else 0
            if doc.get("category_group_code") == "CT1":
                score += 2
            if _normalize(place_name) == _normalize(name):
                score += 3
            elif _normalize(place_name) == _normalize(query):
                score += 2
            scored.append((score, doc))
        time.sleep(0.05)
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


def _culture_items(url: str, service_key: str) -> list[dict]:
    out: list[dict] = []
    page = 1
    prev_names: tuple[str, ...] = ()
    while page <= 80:
        qs = urllib.parse.urlencode({"pageNo": page, "numOfRows": 10, "MobileOS": "ETC", "MobileApp": "mollip"})
        root = _http_xml(f"{url}?serviceKey={service_key}&{qs}")
        if root is None:
            break
        items = [el for el in root.iter() if el.tag == "item"]
        if not items:
            break
        page_names = tuple((item.findtext("culName") or "").strip() for item in items)
        if page > 1 and page_names == prev_names:
            break
        for item in items:
            row = {child.tag: (child.text or "").strip() for child in list(item)}
            if row.get("culName"):
                out.append(row)
        prev_names = page_names
        page += 1
        time.sleep(0.05)
    return out


def load_culture_index(service_key: str) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for url in (CULTURE_MUSEUM_URL, CULTURE_GALLERY_URL):
        for row in _culture_items(url, service_key):
            key = _normalize(row.get("culName") or "")
            if key and key not in index:
                index[key] = row
    return index


def culture_detail_address(seq: str, service_key: str) -> str:
    if not seq:
        return ""
    qs = urllib.parse.urlencode({"seq": seq, "MobileOS": "ETC", "MobileApp": "mollip"})
    root = _http_xml(f"{CULTURE_DETAIL_URL}?serviceKey={service_key}&{qs}")
    if root is None:
        return ""
    for el in root.iter():
        if el.tag == "culAddr":
            return (el.text or "").strip()
    return ""


def kto_amenities(name: str, api_key: str) -> str:
    search_qs = urllib.parse.urlencode({
        "MobileOS": "ETC",
        "MobileApp": "mollip",
        "_type": "json",
        "keyword": name,
        "numOfRows": "5",
        "pageNo": "1",
    })
    try:
        data = _http_json(f"{KTO_SEARCH_URL}?serviceKey={api_key}&{search_qs}")
        items = data["response"]["body"]["items"]
        if not items:
            return ""
        item_list = items["item"]
        if isinstance(item_list, dict):
            item_list = [item_list]
    except Exception:
        return ""

    content_id = ""
    for item in item_list:
        title = str(item.get("title") or "")
        if names_match(name, title):
            content_id = str(item.get("contentid") or "")
            break
    if not content_id:
        return ""

    detail_qs = urllib.parse.urlencode({
        "MobileOS": "ETC",
        "MobileApp": "mollip",
        "_type": "json",
        "contentId": content_id,
    })
    try:
        data = _http_json(f"{KTO_DETAIL_URL}?serviceKey={api_key}&{detail_qs}")
        item = data["response"]["body"]["items"]["item"]
        if isinstance(item, list):
            item = item[0]
    except Exception:
        return ""

    labels: list[str] = []
    for key, label in KTO_AMENITY_LABELS.items():
        value = str(item.get(key) or "").strip()
        if value and value not in {"0", "-", "없음"}:
            labels.append(label)
    return "+".join(labels)


def _valid_phone(value: str) -> bool:
    phone = value.strip()
    if len(phone) < 7 or not re.search(r"\d", phone):
        return False
    digits = re.sub(r"\D", "", phone)
    return bool(digits) and not set(digits) <= {"0"}


def _valid_address(value: str) -> bool:
    return len(value.strip()) >= 6


def fill_from_kakao(name: str, kakao_key: str) -> dict[str, str]:
    doc = kakao_place(name, kakao_key)
    if not doc:
        return {}
    patch: dict[str, str] = {}
    address = (doc.get("road_address_name") or doc.get("address_name") or "").strip()
    if _valid_address(address):
        patch["address"] = address
    phone = (doc.get("phone") or "").strip()
    if _valid_phone(phone):
        patch["phone"] = phone
    x, y = (doc.get("x") or "").strip(), (doc.get("y") or "").strip()
    if x and y:
        patch["gps_x"] = x
        patch["gps_y"] = y
    return patch


def fill_from_culture(name: str, culture_index: dict[str, dict], service_key: str, need_address: bool) -> dict[str, str]:
    row = culture_index.get(_normalize(name))
    if row is None:
        for cul_name, candidate in culture_index.items():
            if names_match(name, candidate.get("culName") or cul_name):
                row = candidate
                break
    if row is None:
        return {}
    patch: dict[str, str] = {}
    phone = (row.get("culTel") or "").strip()
    if _valid_phone(phone):
        patch["phone"] = phone
    x, y = (row.get("gpsX") or "").strip(), (row.get("gpsY") or "").strip()
    if x and y:
        patch["gps_x"] = x
        patch["gps_y"] = y
    if need_address:
        address = culture_detail_address(row.get("seq") or "", service_key)
        if _valid_address(address):
            patch["address"] = address
        time.sleep(0.05)
    return patch


def take_empty_fields(row: dict, incoming: dict[str, str]) -> dict[str, str]:
    patch: dict[str, str] = {}
    for field in ("address", "phone", "gps_x", "gps_y", "amenities"):
        if field in incoming and _empty(row.get(field)) and not _empty(incoming[field]):
            patch[field] = incoming[field]
    return patch


def fetch_museums(base: str, key: str) -> list[dict]:
    return sb_get(
        "/rest/v1/museums?select=id,name,address,phone,gps_x,gps_y,amenities&limit=5000",
        base,
        key,
    )


def fill_empty_museum_fields(
    base: str,
    key: str,
    env: dict[str, str] | None = None,
    dry_run: bool = False,
) -> dict[str, int]:
    env = env or load_env()
    kakao_key = env.get("KAKAO_API_KEY") or env.get("EXPO_PUBLIC_KAKAO_API_KEY") or ""
    data_key = env.get("EXPO_PUBLIC_DATA_KEY") or env.get("EXPO_PUBLIC_ART_MUSEUM_API_KEY") or ""
    kto_key = env.get("EXPO_PUBLIC_KTO_API_KEY") or ""

    rows = [
        row
        for row in fetch_museums(base, key)
        if _empty(row.get("address"))
        or _empty(row.get("phone"))
        or _empty(row.get("gps_x"))
        or _empty(row.get("gps_y"))
        or _empty(row.get("amenities"))
    ]
    stats = {"need": len(rows), "updated": 0, "skipped": 0, "failed": 0}
    if not rows:
        print("빈 필드가 있는 미술관 없음")
        return stats

    print(f"빈 필드 미술관 {len(rows)}개{' (dry-run)' if dry_run else ''}")
    culture_index: dict[str, dict] | None = None

    for row in rows:
        name = (row.get("name") or "").strip()
        if not name:
            stats["skipped"] += 1
            continue

        incoming: dict[str, str] = {}
        if kakao_key and (
            _empty(row.get("address")) or _empty(row.get("phone")) or _empty(row.get("gps_x")) or _empty(row.get("gps_y"))
        ):
            incoming.update(fill_from_kakao(name, kakao_key))
            time.sleep(0.1)

        still_needs_contact = any(
            _empty(row.get(field)) and field not in incoming
            for field in ("address", "phone", "gps_x", "gps_y")
        )
        if still_needs_contact and data_key:
            if culture_index is None:
                print("문화포털 공간정보 목록 로드 중…")
                culture_index = load_culture_index(data_key)
                print(f"문화포털 {len(culture_index)}곳")
            incoming.update(
                fill_from_culture(name, culture_index, data_key, need_address=_empty(row.get("address")) and "address" not in incoming)
            )

        if _empty(row.get("amenities")) and kto_key:
            amenities = kto_amenities(name, kto_key)
            if amenities:
                incoming["amenities"] = amenities
            time.sleep(0.25)

        patch = take_empty_fields(row, incoming)
        if not patch:
            stats["skipped"] += 1
            print(f"  · {name}: 채울 값 없음")
            continue

        if not dry_run:
            try:
                status = sb_patch(f"/rest/v1/museums?id=eq.{row['id']}", base, key, patch)
            except urllib.error.HTTPError as exc:
                print(f"  x {name}: HTTP {exc.code}", file=sys.stderr)
                stats["failed"] += 1
                continue
            if status not in (200, 204):
                print(f"  x {name}: HTTP {status}", file=sys.stderr)
                stats["failed"] += 1
                continue

        stats["updated"] += 1
        print(f"  + {name}: {', '.join(patch)}")

    print(
        f"완료: 대상 {stats['need']} / 채움 {stats['updated']} / 스킵 {stats['skipped']} / 실패 {stats['failed']}"
    )
    return stats


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    env = load_env()
    base = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not base or not key:
        print("Need EXPO_PUBLIC_SUPABASE_URL and a Supabase key", file=sys.stderr)
        sys.exit(1)
    fill_empty_museum_fields(base, key, env, dry_run=dry_run)


if __name__ == "__main__":
    main()
