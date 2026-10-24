#!/usr/bin/env python3
"""
mollip pipeline board — local web UI (reference: multi-agent “cell” rooms).

  python3 tools/pipeline-board/serve.py
  open http://127.0.0.1:8765

Set PIPELINE_BOARD_URL=http://127.0.0.1:8765 when running pipeline_emit.py for instant push.
"""
from __future__ import annotations

import json
import mimetypes
import os
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from team_dialogue import generate_replies, generate_standup

REPO = Path(__file__).resolve().parents[2]
WIP = REPO / ".docs" / "wip"
BOARD_DIR = Path(__file__).resolve().parent
PORT = int(os.environ.get("PIPELINE_BOARD_PORT", "8765"))

_subscribers: dict[str, list[dict]] = {}
_sub_lock = threading.Lock()


def _log_path(slug: str) -> Path:
    return WIP / slug / "pipeline-events.jsonl"


def _list_slugs() -> list[str]:
    if not WIP.is_dir():
        return []
    slugs = []
    for d in sorted(WIP.iterdir()):
        if d.is_dir() and (d / "pipeline-events.jsonl").is_file():
            slugs.append(d.name)
    return slugs


def _wip_dir(slug: str) -> Path | None:
    if not slug or ".." in slug or "/" in slug or "\\" in slug:
        return None
    d = (WIP / slug).resolve()
    if not str(d).startswith(str(WIP.resolve())):
        return None
    return d


def _resolve_artifact_file(d: Path, name: str) -> Path | None:
    direct = (d / name).resolve()
    if str(direct).startswith(str(d.resolve())) and direct.is_file():
        return direct
    want = name.lower()
    for f in d.iterdir():
        if f.is_file() and f.name.lower() == want:
            return f.resolve()
    return None


def _read_artifact(slug: str, name: str) -> str | None:
    if not name or ".." in name or "/" in name or "\\" in name:
        return None
    d = _wip_dir(slug)
    if not d:
        return None
    path = _resolve_artifact_file(d, name)
    if not path or not str(path).startswith(str(d.resolve())):
        return None
    return path.read_text(encoding="utf-8")


def _read_events(slug: str) -> list[dict]:
    path = _log_path(slug)
    if not path.is_file():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def _write_events(slug: str, events: list[dict]) -> None:
    path = _log_path(slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for ev in events:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")


def _clear_chat_events(slug: str) -> int:
    events = _read_events(slug)
    kept = [e for e in events if e.get("kind") != "chat"]
    removed = len(events) - len(kept)
    if removed:
        _write_events(slug, kept)
    return removed


def _append_event(event: dict) -> None:
    slug = event.get("slug")
    if not slug:
        return
    path = _log_path(slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
    _broadcast(slug, event)


def _broadcast(slug: str, event: dict) -> None:
    data = f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode("utf-8")
    with _sub_lock:
        dead = []
        for sub in _subscribers.get(slug, []):
            try:
                sub["queue"].append(data)
                sub["event"].set()
            except Exception:
                dead.append(sub)
        for sub in dead:
            _subscribers[slug].remove(sub)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        if os.environ.get("PIPELINE_BOARD_QUIET"):
            return
        super().log_message(fmt, *args)

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        if parsed.path == "/api/slugs":
            return self._json({"slugs": _list_slugs()})

        if parsed.path == "/api/health":
            return self._json({"ok": True, "version": 2, "features": ["chat", "standup", "artifact", "stream", "chat_clear"]})

        if parsed.path == "/api/events":
            slug = (qs.get("slug") or [""])[0]
            if not slug:
                return self._json({"error": "slug required"}, 400)
            return self._json({"events": _read_events(slug)})

        if parsed.path == "/api/artifact":
            slug = (qs.get("slug") or [""])[0]
            name = (qs.get("file") or [""])[0]
            if not slug or not name:
                return self._json({"error": "slug and file required"}, 400)
            text = _read_artifact(slug, name)
            if text is None:
                d = _wip_dir(slug)
                hint = str(d) if d else "invalid slug"
                return self._json({"error": "not found", "slug": slug, "file": name, "wip": hint}, 404)
            return self._json({"slug": slug, "file": name, "content": text})

        if parsed.path == "/api/stream":
            slug = (qs.get("slug") or [""])[0]
            if not slug:
                self.send_error(400)
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            queue: list[bytes] = []
            wake = threading.Event()
            sub = {"queue": queue, "event": wake}
            with _sub_lock:
                _subscribers.setdefault(slug, []).append(sub)

            try:
                for ev in _read_events(slug):
                    msg = f"data: {json.dumps(ev, ensure_ascii=False)}\n\n".encode("utf-8")
                    self.wfile.write(msg)
                    self.wfile.flush()
                while True:
                    while queue:
                        chunk = queue.pop(0)
                        self.wfile.write(chunk)
                        self.wfile.flush()
                    wake.clear()
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
                    wake.wait(timeout=15.0)
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                with _sub_lock:
                    if slug in _subscribers and sub in _subscribers[slug]:
                        _subscribers[slug].remove(sub)
            return

        # static
        rel = parsed.path.lstrip("/") or "index.html"
        file_path = (BOARD_DIR / rel).resolve()
        if not str(file_path).startswith(str(BOARD_DIR.resolve())):
            self.send_error(403)
            return
        if not file_path.is_file():
            self.send_error(404)
            return
        ctype, _ = mimetypes.guess_type(str(file_path))
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            return self._json({"error": "invalid json"}, 400)

        if path == "/api/emit":
            event = payload
            if not event.get("slug") or not event.get("role"):
                return self._json({"error": "slug and role required"}, 400)
            if not event.get("ts"):
                event["ts"] = datetime.now(timezone.utc).isoformat()
            _append_event(event)
            return self._json({"ok": True, "event": event})

        if path == "/api/chat":
            slug = payload.get("slug")
            role = payload.get("role") or "You"
            body = (payload.get("body") or "").strip()
            if not slug or not body:
                return self._json({"error": "slug and body required"}, 400)
            user_ev = {
                "ts": datetime.now(timezone.utc).isoformat(),
                "slug": slug,
                "role": role,
                "kind": "chat",
                "body": body,
            }
            _append_event(user_ev)
            emitted = [user_ev]
            if payload.get("auto_reply", True) and role == "You":
                for reply in generate_replies(slug, body, user_ev["ts"]):
                    _append_event(reply)
                    emitted.append(reply)
            return self._json({"ok": True, "events": emitted})

        if path == "/api/standup":
            slug = payload.get("slug")
            if not slug:
                return self._json({"error": "slug required"}, 400)
            emitted = []
            for ev in generate_standup(slug):
                _append_event(ev)
                emitted.append(ev)
            return self._json({"ok": True, "events": emitted})

        if path == "/api/chat/clear":
            slug = payload.get("slug")
            if not slug:
                return self._json({"error": "slug required"}, 400)
            removed = _clear_chat_events(slug)
            return self._json({"ok": True, "removed": removed})

        self.send_error(404)
        return


def main() -> None:
    os.chdir(BOARD_DIR)
    host = "127.0.0.1"
    httpd = ThreadingHTTPServer((host, PORT), Handler)
    print(f"Pipeline board: http://{host}:{PORT}", file=sys.stderr)
    print(f"WIP logs: {WIP}", file=sys.stderr)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
