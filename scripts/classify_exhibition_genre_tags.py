#!/usr/bin/env python3
"""
exhibitions.genre / exhibitions.type / exhibitions.tags 일괄 분류 (규칙 기반).

- genre: 회화·사진·조각 등 미술 매체 1개
- type: 상설전/기획전/특별전 등 전시 유형 1개
- tags: 테마·추가 매체 키워드 (유형 제외)

사용:
  python3 scripts/classify_exhibition_genre_tags.py --dry-run
  python3 scripts/classify_exhibition_genre_tags.py --apply
  python3 scripts/classify_exhibition_genre_tags.py --apply --only-null-genre

.env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (또는 ANON_KEY)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(REPO_ROOT, ".env")

NON_ART_GENRE = {
    "전시",
    "현재 전시",
    "예정 전시",
    "과거 전시",
    "현재전시",
    "예정전시",
    "과거전시",
    "기획전시",
}

ART_GENRE_RULES: list[tuple[str, list[str]]] = [
    ("미디어아트", ["미디어아트", "미디어 아트", "뉴미디어", "ai 미디어", "media art", "몰입형"]),
    ("영상", ["영상", "비디오", "video", "vr ", " ar ", "film"]),
    ("사진", ["사진", "photo", "photography", "포토"]),
    ("조각", ["조각", "sculpture", "입체"]),
    ("설치", ["설치", "installation"]),
    ("사운드", ["사운드", "sound art", "음향"]),
    ("드로잉", ["드로잉", "drawing", "소묘"]),
    ("판화", ["판화", "print", "에칭", "리토그래프"]),
    ("한국화", ["한국화", "동양화", "수묵"]),
    ("회화", ["회화", "painting", "유화", "아크릴", "캔버스"]),
    ("공예", ["공예", "도예", "ceramic", "금속공예"]),
    ("섬유", ["섬유", "직물", "quilt"]),
    ("그래픽", ["그래픽", "일러스트"]),
    ("팝아트", ["팝아트", "pop art"]),
    ("현대미술", ["현대미술", "contemporary"]),
]

TYPE_TAG_RULES: list[tuple[str, list[str]]] = [
    ("상설전", ["상설", "상설전", "소장품전", "소장품", "collection"]),
    ("기획전", ["기획전", "기획 전시", "기획展"]),
    ("특별전", ["특별전"]),
    (
        "아카이브",
        [
            "아카이브",
            "archive",
            "archival",
            "기록물",
            "문헌",
            "문헌자료",
            "역사자료",
            "기록 전시",
            "자료 전시",
            "편지",
            "서한",
            "고문서",
            "문서자료",
            "문헌 전시",
        ],
    ),
    ("초대전", ["초대전"]),
    ("개인전", ["개인전", "solo"]),
    ("그룹전", ["그룹전", "단체전"]),
    ("회고전", ["회고전", "retrospective"]),
    ("순회전", ["순회"]),
    ("팝업", ["팝업", "popup"]),
]

THEME_TAG_RULES: list[tuple[str, list[str]]] = [
    ("무료", ["무료 관람", "무료입장", "관람료 무료"]),
]

KIDS_TAG = "키즈"


def finalize_tags(tags: list[str]) -> list[str]:
    if KIDS_TAG in tags:
        return []
    return tags

ART_GENRE_LABELS = {label for label, _ in ART_GENRE_RULES}


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def supabase_request(method: str, path: str, base_url: str, api_key: str, body=None):
    url = f"{base_url}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", api_key)
    req.add_header("Authorization", f"Bearer {api_key}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None


def normalize_text(*parts: str | None) -> str:
    return re.sub(r"\s+", " ", " ".join(p for p in parts if p)).lower()


def parse_compound_genre(raw: str) -> list[str]:
    parts = re.split(r"[,，·/、]| 및 | 등|\(", raw)
    out: list[str] = []
    for p in parts:
        p = re.sub(r"\d+점.*$", "", p).strip()
        if len(p) >= 2 and p not in NON_ART_GENRE and p not in TYPE_LABELS:
            out.append(p)
    return out


def match_rules(text: str, rules: list[tuple[str, list[str]]]) -> list[str]:
    found: list[str] = []
    for label, keywords in rules:
        if any(kw.lower() in text for kw in keywords):
            found.append(label)
    return found


def normalize_tags(raw) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(t) for t in raw if t]
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return []
        if s.startswith("["):
            try:
                parsed = json.loads(s)
                if isinstance(parsed, list):
                    return [str(t) for t in parsed if t]
            except json.JSONDecodeError:
                pass
        return [s]
    return []


def tags_equal(a: list[str], b: list[str]) -> bool:
    return sorted(a) == sorted(b)


TYPE_LABELS = {label for label, _ in TYPE_TAG_RULES}


def pick_exhibition_type(type_matches: list[str]) -> str | None:
    for label, _ in TYPE_TAG_RULES:
        if label in type_matches:
            return label
    return None


def pick_primary_genre(candidates: list[str]) -> str | None:
    for label, _ in ART_GENRE_RULES:
        if label in candidates:
            return label
    for c in candidates:
        if c not in TYPE_LABELS and c not in NON_ART_GENRE:
            return c
    return None


def infer_genre_type_tags(
    title: str, description: str | None, legacy_genre: str | None
) -> tuple[str | None, str | None, list[str]]:
    legacy = (legacy_genre or "").strip()
    from_legacy = parse_compound_genre(legacy) if legacy and legacy not in NON_ART_GENRE else []
    text = normalize_text(title, description, legacy)

    art_from_rules = match_rules(text, ART_GENRE_RULES)
    type_matches = match_rules(text, TYPE_TAG_RULES)
    theme_tags = match_rules(text, THEME_TAG_RULES)

    genre_candidates: list[str] = []
    seen: set[str] = set()
    for g in from_legacy + art_from_rules:
        if g in TYPE_LABELS or g in seen:
            continue
        seen.add(g)
        genre_candidates.append(g)

    primary = pick_primary_genre(genre_candidates)
    exhibition_type = pick_exhibition_type(type_matches)
    tags = finalize_tags(
        sorted(
            t
            for t in set(theme_tags)
            if t not in TYPE_LABELS and t not in ART_GENRE_LABELS
        )
    )
    return primary, exhibition_type, tags


def infer_genre_tags(title: str, description: str | None, legacy_genre: str | None) -> tuple[str | None, list[str]]:
    genre, _, tags = infer_genre_type_tags(title, description, legacy_genre)
    return genre, tags


def fetch_all_rows(base_url: str, api_key: str) -> list[dict]:
    rows: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        path = (
            "/rest/v1/exhibitions"
            f"?select=id,title,description,genre,type,tags"
            f"&order=id.asc"
            f"&limit={page_size}&offset={offset}"
        )
        batch = supabase_request("GET", path, base_url, api_key)
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="DB 변경 없이 통계만")
    parser.add_argument("--apply", action="store_true", help="PATCH로 DB 반영")
    parser.add_argument("--only-null-genre", action="store_true", help="genre IS NULL 행만")
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--workers", type=int, default=12, help="병렬 PATCH 수")
    args = parser.parse_args()
    if not args.dry_run and not args.apply:
        parser.error("--dry-run 또는 --apply 중 하나 필요")

    env = load_env()
    base_url = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    api_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not base_url or not api_key:
        print(".env에 EXPO_PUBLIC_SUPABASE_URL 과 SERVICE_ROLE_KEY(권장) 필요", file=sys.stderr)
        sys.exit(1)

    rows = fetch_all_rows(base_url, api_key)
    print(f"loaded {len(rows)} exhibitions")

    stats = {"genre_set": 0, "genre_null": 0, "type_set": 0, "tags_nonempty": 0, "updated": 0}
    samples: list[tuple[int, str | None, str | None, list[str], str]] = []

    updates: list[dict] = []
    for row in rows:
        if args.only_null_genre and row.get("genre") is not None:
            continue
        genre, exhibition_type, tags = infer_genre_type_tags(
            row.get("title") or "",
            row.get("description"),
            row.get("genre"),
        )
        if not exhibition_type:
            existing_tags = normalize_tags(row.get("tags"))
            exhibition_type = pick_exhibition_type(
                [t for t in existing_tags if t in TYPE_LABELS]
            )
        tags = finalize_tags(
            [t for t in tags if t not in TYPE_LABELS and t not in ART_GENRE_LABELS]
        )
        existing_tags = normalize_tags(row.get("tags"))
        for t in existing_tags:
            if t in TYPE_LABELS or t in ART_GENRE_LABELS:
                continue
            if t not in tags:
                tags.append(t)
        tags = finalize_tags(sorted(tags))

        if genre:
            stats["genre_set"] += 1
        else:
            stats["genre_null"] += 1
        if exhibition_type:
            stats["type_set"] += 1
        if tags:
            stats["tags_nonempty"] += 1
        if len(samples) < 8 and (genre or exhibition_type or tags):
            samples.append(
                (row["id"], genre, exhibition_type, tags, (row.get("title") or "")[:40])
            )

        existing_tags = normalize_tags(row.get("tags"))
        existing_tags = [
            t for t in existing_tags if t not in TYPE_LABELS and t not in ART_GENRE_LABELS
        ]
        if (
            genre != row.get("genre")
            or exhibition_type != row.get("type")
            or not tags_equal(tags, existing_tags)
        ):
            updates.append(
                {
                    "id": row["id"],
                    "genre": genre,
                    "type": exhibition_type,
                    "tags": tags if tags else None,
                }
            )

    print("stats after inference:", stats)
    print("rows to update:", len(updates))
    for sid, g, ty, t, title in samples:
        print(f"  sample id={sid} genre={g} type={ty} tags={t} title={title!r}")

    if args.dry_run:
        return

    def patch_one(item: dict) -> tuple[int, bool]:
        eid = item["id"]
        body = {"genre": item["genre"], "type": item["type"], "tags": item["tags"]}
        path = f"/rest/v1/exhibitions?id=eq.{eid}"
        try:
            supabase_request("PATCH", path, base_url, api_key, body=body)
            return eid, True
        except Exception as ex:
            print(f"PATCH failed id={eid}: {ex}", file=sys.stderr, flush=True)
            return eid, False

    workers = max(1, args.workers)
    done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(patch_one, item) for item in updates]
        for fut in as_completed(futures):
            _, ok = fut.result()
            if ok:
                stats["updated"] += 1
            done += 1
            if done % 200 == 0 or done == len(updates):
                print(f"patched {done}/{len(updates)}", flush=True)

    print("done, updated:", stats["updated"])


if __name__ == "__main__":
    main()
