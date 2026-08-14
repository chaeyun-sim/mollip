#!/usr/bin/env python3
"""museums 테이블에서 gps_x/gps_y가 없는 행을 카카오 주소 검색 API로 채운다.

사용법:
  python scripts/fill_museum_gps.py [--dry-run]

필요한 .env 변수:
  EXPO_PUBLIC_SUPABASE_URL   Supabase 프로젝트 URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY  (또는 SUPABASE_SERVICE_ROLE_KEY)
  KAKAO_API_KEY              카카오 REST API 키 (Supabase Secrets에 등록된 것과 동일)
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

KAKAO_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json"
KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"


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
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status


def kakao_geocode_address(address: str, api_key: str) -> tuple[str, str] | None:
    """주소 → (gps_x, gps_y) 반환. 실패 시 None."""
    params = urllib.parse.urlencode({"query": address, "size": 1})
    req = urllib.request.Request(f"{KAKAO_ADDRESS_URL}?{params}")
    req.add_header("Authorization", f"KakaoAK {api_key}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        docs = data.get("documents", [])
        if docs:
            d = docs[0]
            x = d.get("x") or d.get("road_address", {}).get("x") or d.get("address", {}).get("x")
            y = d.get("y") or d.get("road_address", {}).get("y") or d.get("address", {}).get("y")
            if x and y:
                return str(x), str(y)
    except Exception as e:
        print(f"  [주소검색 오류] {e}", file=sys.stderr)
    return None


def kakao_geocode_keyword(name: str, api_key: str) -> tuple[str, str] | None:
    """미술관 이름 키워드 검색 → (gps_x, gps_y) 반환. 실패 시 None."""
    params = urllib.parse.urlencode({"query": name, "size": 1})
    req = urllib.request.Request(f"{KAKAO_KEYWORD_URL}?{params}")
    req.add_header("Authorization", f"KakaoAK {api_key}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        docs = data.get("documents", [])
        if docs:
            d = docs[0]
            x, y = d.get("x"), d.get("y")
            if x and y:
                return str(x), str(y)
    except Exception as e:
        print(f"  [키워드검색 오류] {e}", file=sys.stderr)
    return None


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    env = load_env()
    supabase_url = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")
    kakao_key = env.get("KAKAO_API_KEY", "")

    if not supabase_url or not supabase_key:
        sys.exit("❌  EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY(또는 ANON_KEY) 미설정")
    if not kakao_key:
        sys.exit("❌  KAKAO_API_KEY 미설정 (.env에 KAKAO_API_KEY=<REST API 키> 추가 필요)")

    # gps_x 또는 gps_y가 NULL인 행 전체 조회
    path = "/rest/v1/museums?or=(gps_x.is.null,gps_y.is.null)&select=id,name,address&limit=1000"
    rows = sb_get(path, supabase_url, supabase_key)

    if not rows:
        print("✅  GPS 누락 미술관 없음.")
        return

    print(f"GPS 누락 미술관 {len(rows)}개 발견{' (dry-run)' if dry_run else ''}:\n")

    updated = 0
    skipped = 0

    for row in rows:
        museum_id = row["id"]
        name = row.get("name", "")
        address = row.get("address") or ""

        coords: tuple[str, str] | None = None

        # 1순위: 주소로 좌표 검색
        if address:
            coords = kakao_geocode_address(address, kakao_key)
            if coords:
                print(f"  ✅ [{name}] 주소 검색 성공: x={coords[0]}, y={coords[1]}")

        # 2순위: 이름으로 키워드 검색
        if not coords and name:
            coords = kakao_geocode_keyword(name, kakao_key)
            if coords:
                print(f"  ✅ [{name}] 키워드 검색 성공: x={coords[0]}, y={coords[1]}")

        if not coords:
            print(f"  ⚠️  [{name}] 좌표 찾기 실패 (address={address!r})")
            skipped += 1
            continue

        if not dry_run:
            status = sb_patch(
                f"/rest/v1/museums?id=eq.{urllib.parse.quote(museum_id)}",
                supabase_url,
                supabase_key,
                {"gps_x": coords[0], "gps_y": coords[1]},
            )
            if status not in (200, 204):
                print(f"  ❌ [{name}] 업데이트 실패 (HTTP {status})", file=sys.stderr)
                skipped += 1
                continue

        updated += 1
        # 카카오 API 레이트 리밋 방지
        time.sleep(0.1)

    print(f"\n완료: {updated}개 업데이트, {skipped}개 실패/스킵")


if __name__ == "__main__":
    main()
