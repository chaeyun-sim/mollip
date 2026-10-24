#!/usr/bin/env python3
"""museums 테이블에서 accessibility가 없는 행을 한국관광공사_무장애 여행정보 API로 채운다.

사용법:
  python3 scripts/fill_museum_accessibility.py [--dry-run] [--force]

옵션:
  --dry-run  DB를 실제로 업데이트하지 않고 결과만 출력
  --force    이미 accessibility가 있는 행도 덮어씀

필요한 .env 변수:
  EXPO_PUBLIC_SUPABASE_URL       Supabase 프로젝트 URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY  (또는 SUPABASE_SERVICE_ROLE_KEY)
  EXPO_PUBLIC_KTO_API_KEY        한국관광공사_무장애 여행정보 API 키
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

KTO_BASE = "https://apis.data.go.kr/B551011/KorWithService2"
SEARCH_URL = f"{KTO_BASE}/searchKeyword2"
DETAIL_URL = f"{KTO_BASE}/detailWithTour2"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def sb_get(path: str, base: str, key: str) -> list[dict]:
    url = f"{base}{path}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def sb_patch(path: str, base: str, key: str, body: dict) -> int:
    url = f"{base}{path}"
    data = json.dumps(body, ensure_ascii=False).encode()
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status


def kto_get(url: str, params: dict[str, str]) -> dict:
    """한국관광공사 API 호출.

    serviceKey는 이미 URL-인코딩된 상태일 수 있으므로 urlencode에서 분리해 직접 붙인다.
    """
    service_key = params.pop("serviceKey", "")
    other_qs = urllib.parse.urlencode(params)
    full_url = f"{url}?serviceKey={service_key}&{other_qs}"
    req = urllib.request.Request(full_url)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  [KTO API 오류] {e}", file=sys.stderr)
        return {}


def search_content_id(name: str, api_key: str) -> str | None:
    """미술관/박물관 이름으로 검색해 contentId 반환. 없으면 None."""
    data = kto_get(SEARCH_URL, {
        "serviceKey": api_key,
        "MobileOS": "ETC",
        "MobileApp": "mollip",
        "_type": "json",
        "keyword": name,
        "numOfRows": "5",
        "pageNo": "1",
    })
    try:
        items = data["response"]["body"]["items"]
        if not items or items == "":
            return None
        item_list = items["item"]
        if isinstance(item_list, dict):
            item_list = [item_list]
        if not item_list:
            return None
        return str(item_list[0]["contentid"])
    except (KeyError, TypeError, IndexError):
        return None


def fetch_accessibility(content_id: str, api_key: str) -> dict | None:
    """contentId로 detailWithTour2 호출 → 무장애 접근성 필드 dict 반환."""
    # KorWithService2는 contentTypeId 파라미터 없이 호출
    data = kto_get(DETAIL_URL, {
        "serviceKey": api_key,
        "MobileOS": "ETC",
        "MobileApp": "mollip",
        "_type": "json",
        "contentId": content_id,
    })
    try:
        item = data["response"]["body"]["items"]["item"]
        if isinstance(item, list):
            item = item[0]
    except (KeyError, TypeError, IndexError):
        return None

    def val(key: str) -> str | None:
        v = item.get(key)
        if not v or str(v).strip() in ("", "0", "-"):
            return None
        return str(v).strip()

    result: dict[str, str] = {}
    # 이동/접근
    if v := val("route"):       result["route"] = v
    if v := val("exit"):        result["exit"] = v
    if v := val("elevator"):    result["elevator"] = v
    # 주차
    if v := val("parking"):     result["parking"] = v
    # 편의시설
    if v := val("wheelchair"):  result["wheelchair"] = v
    if v := val("restroom"):    result["restroom"] = v
    if v := val("auditorium"):  result["auditorium"] = v
    if v := val("stroller"):    result["stroller"] = v
    if v := val("lactationroom"): result["lactationroom"] = v
    # 시각장애
    if v := val("audioguide"):     result["audioguide"] = v
    if v := val("braileblock"):    result["braileblock"] = v
    if v := val("brailepromotion"): result["brailepromotion"] = v
    if v := val("bigprint"):       result["bigprint"] = v
    if v := val("guidehuman"):     result["guidehuman"] = v
    # 청각장애
    if v := val("signguide"):      result["signguide"] = v
    if v := val("videoguide"):     result["videoguide"] = v

    return result if result else None


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    force = "--force" in sys.argv

    env = load_env()
    supabase_url = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_key = (
        env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")
    )
    data_api_key = env.get("EXPO_PUBLIC_KTO_API_KEY", "")

    if not supabase_url or not supabase_key:
        sys.exit("❌  EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY(또는 ANON_KEY) 미설정")
    if not data_api_key:
        sys.exit("❌  EXPO_PUBLIC_KTO_API_KEY 미설정")

    if force:
        path = "/rest/v1/museums?select=id,name,address&limit=1000"
    else:
        path = "/rest/v1/museums?accessibility=is.null&select=id,name,address&limit=1000"

    rows = sb_get(path, supabase_url, supabase_key)

    if not rows:
        print("✅  처리할 미술관 없음.")
        return

    label = " (dry-run)" if dry_run else ""
    force_label = " [force 모드]" if force else ""
    print(f"접근성 정보 없는 미술관 {len(rows)}개 처리{force_label}{label}\n")

    updated = 0
    skipped = 0
    not_found = 0

    for row in rows:
        museum_id = row["id"]
        name = row.get("name", "")

        content_id = search_content_id(name, data_api_key)
        if not content_id:
            print(f"  ⚠️  [{name}] 검색 결과 없음")
            not_found += 1
            time.sleep(0.3)
            continue

        accessibility = fetch_accessibility(content_id, data_api_key)
        if not accessibility:
            print(f"  ⚠️  [{name}] contentId={content_id} 무장애 데이터 없음")
            not_found += 1
            time.sleep(0.3)
            continue

        keys_found = list(accessibility.keys())
        print(f"  ✅ [{name}] contentId={content_id} → {keys_found}")

        if not dry_run:
            status = sb_patch(
                f"/rest/v1/museums?id=eq.{museum_id}",
                supabase_url,
                supabase_key,
                {"accessibility": accessibility},
            )
            if status not in (200, 204):
                print(f"  ❌ [{name}] 업데이트 실패 (HTTP {status})", file=sys.stderr)
                skipped += 1
                continue

        updated += 1
        time.sleep(0.3)

    print(f"\n완료: {updated}개 업데이트, {not_found}개 미발견, {skipped}개 실패")


if __name__ == "__main__":
    main()
