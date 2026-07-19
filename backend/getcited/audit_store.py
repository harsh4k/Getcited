"""User-owned audit snapshots: crawl pages, AEO writeups, and ad placements."""

from __future__ import annotations

import base64
import hashlib
import json
import sqlite3
from typing import Any
from urllib.parse import urlparse

from ab_store import _now, get_db


def init_audit_tables(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            name TEXT,
            site_url TEXT,
            source TEXT,
            sitemap_found INTEGER NOT NULL DEFAULT 0,
            link_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            refreshed_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audit_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            content_hash TEXT NOT NULL DEFAULT '',
            status INTEGER,
            ok INTEGER NOT NULL DEFAULT 0,
            error TEXT,
            state TEXT NOT NULL DEFAULT 'active',
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            aeo_json TEXT,
            aeo_source_hash TEXT,
            aeo_generated_at TEXT,
            ads_json TEXT,
            ads_image BLOB,
            ads_source_hash TEXT,
            ads_generated_at TEXT,
            UNIQUE(audit_id, url),
            FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_audits_user ON audits(user_id, refreshed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_pages_audit ON audit_pages(audit_id, state);
        """
    )


def content_hash(content: str) -> str:
    normalized = (content or "").strip().encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()


def normalize_audit_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("Invalid URL")
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _page_row_to_dict(row: sqlite3.Row | dict[str, Any], *, include_image: bool = True) -> dict[str, Any]:
    data = dict(row)
    aeo = None
    if data.get("aeo_json"):
        try:
            aeo = json.loads(data["aeo_json"])
        except json.JSONDecodeError:
            aeo = None

    ads = None
    if data.get("ads_json"):
        try:
            ads = json.loads(data["ads_json"])
        except json.JSONDecodeError:
            ads = None
        if ads is not None and include_image and data.get("ads_image"):
            ads = {
                **ads,
                "image_base64": base64.b64encode(data["ads_image"]).decode("ascii"),
            }

    page_hash = data.get("content_hash") or ""
    aeo_outdated = bool(aeo) and bool(data.get("aeo_source_hash")) and data["aeo_source_hash"] != page_hash
    ads_outdated = bool(ads) and bool(data.get("ads_source_hash")) and data["ads_source_hash"] != page_hash

    return {
        "id": data["id"],
        "audit_id": data["audit_id"],
        "url": data["url"],
        "content": data.get("content") or "",
        "content_hash": page_hash,
        "status": data.get("status"),
        "ok": bool(data.get("ok")),
        "error": data.get("error"),
        "state": data.get("state") or "active",
        "first_seen_at": data.get("first_seen_at"),
        "last_seen_at": data.get("last_seen_at"),
        "aeo": aeo,
        "aeo_source_hash": data.get("aeo_source_hash"),
        "aeo_generated_at": data.get("aeo_generated_at"),
        "aeo_outdated": aeo_outdated,
        "ads": ads,
        "ads_source_hash": data.get("ads_source_hash"),
        "ads_generated_at": data.get("ads_generated_at"),
        "ads_outdated": ads_outdated,
    }


def _audit_summary(row: sqlite3.Row | dict[str, Any], page_stats: dict[str, int] | None = None) -> dict[str, Any]:
    data = dict(row)
    stats = page_stats or {}
    return {
        "id": data["id"],
        "user_id": data["user_id"],
        "url": data["url"],
        "name": data.get("name"),
        "site_url": data.get("site_url"),
        "source": data.get("source"),
        "sitemap_found": bool(data.get("sitemap_found")),
        "link_count": data.get("link_count") or 0,
        "created_at": data["created_at"],
        "refreshed_at": data["refreshed_at"],
        "page_count": stats.get("page_count", 0),
        "active_page_count": stats.get("active_page_count", 0),
        "deleted_page_count": stats.get("deleted_page_count", 0),
        "aeo_count": stats.get("aeo_count", 0),
        "ads_count": stats.get("ads_count", 0),
    }


def _page_stats_for_audits(conn: sqlite3.Connection, audit_ids: list[int]) -> dict[int, dict[str, int]]:
    if not audit_ids:
        return {}
    placeholders = ",".join("?" * len(audit_ids))
    rows = conn.execute(
        f"""
        SELECT
            audit_id,
            COUNT(*) AS page_count,
            SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active_page_count,
            SUM(CASE WHEN state = 'deleted' THEN 1 ELSE 0 END) AS deleted_page_count,
            SUM(CASE WHEN aeo_json IS NOT NULL THEN 1 ELSE 0 END) AS aeo_count,
            SUM(CASE WHEN ads_json IS NOT NULL THEN 1 ELSE 0 END) AS ads_count
        FROM audit_pages
        WHERE audit_id IN ({placeholders})
        GROUP BY audit_id
        """,
        audit_ids,
    ).fetchall()
    return {
        int(row["audit_id"]): {
            "page_count": int(row["page_count"] or 0),
            "active_page_count": int(row["active_page_count"] or 0),
            "deleted_page_count": int(row["deleted_page_count"] or 0),
            "aeo_count": int(row["aeo_count"] or 0),
            "ads_count": int(row["ads_count"] or 0),
        }
        for row in rows
    }


def list_audits(user_id: int, limit: int = 50) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, user_id, url, name, site_url, source, sitemap_found,
                   link_count, created_at, refreshed_at
            FROM audits
            WHERE user_id = ?
            ORDER BY refreshed_at DESC, id DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
        ids = [int(r["id"]) for r in rows]
        stats = _page_stats_for_audits(conn, ids)
    return [_audit_summary(row, stats.get(int(row["id"]))) for row in rows]


def get_audit(audit_id: int, user_id: int) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, url, name, site_url, source, sitemap_found,
                   link_count, created_at, refreshed_at
            FROM audits
            WHERE id = ? AND user_id = ?
            """,
            (audit_id, user_id),
        ).fetchone()
        if not row:
            return None
        pages = conn.execute(
            """
            SELECT id, audit_id, url, content, content_hash, status, ok, error, state,
                   first_seen_at, last_seen_at,
                   aeo_json, aeo_source_hash, aeo_generated_at,
                   ads_json, ads_image, ads_source_hash, ads_generated_at
            FROM audit_pages
            WHERE audit_id = ?
            ORDER BY
                CASE WHEN state = 'active' THEN 0 ELSE 1 END,
                url ASC
            """,
            (audit_id,),
        ).fetchall()
        stats = _page_stats_for_audits(conn, [audit_id]).get(audit_id, {})
    return {
        **_audit_summary(row, stats),
        "pages": [_page_row_to_dict(p) for p in pages],
    }


def rename_audit(audit_id: int, user_id: int, name: str) -> dict[str, Any] | None:
    cleaned = name.strip()
    if not cleaned:
        raise ValueError("Name is required.")
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE audits SET name = ? WHERE id = ? AND user_id = ?",
            (cleaned, audit_id, user_id),
        )
        if cur.rowcount == 0:
            return None
    return get_audit(audit_id, user_id)


def delete_audit(audit_id: int, user_id: int) -> bool:
    with get_db() as conn:
        cur = conn.execute(
            "DELETE FROM audits WHERE id = ? AND user_id = ?",
            (audit_id, user_id),
        )
        return cur.rowcount > 0


def clear_audits(user_id: int) -> int:
    with get_db() as conn:
        cur = conn.execute("DELETE FROM audits WHERE user_id = ?", (user_id,))
        return cur.rowcount


def _insert_pages(
    conn: sqlite3.Connection,
    audit_id: int,
    pages: list[dict[str, Any]],
    *,
    now: str,
) -> None:
    for page in pages:
        url = normalize_audit_url(page["url"]) if page.get("url") else ""
        if not url:
            continue
        content = page.get("content") or ""
        ok = 1 if page.get("ok") else 0
        conn.execute(
            """
            INSERT INTO audit_pages (
                audit_id, url, content, content_hash, status, ok, error, state,
                first_seen_at, last_seen_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
            """,
            (
                audit_id,
                url,
                content,
                content_hash(content),
                page.get("status"),
                ok,
                page.get("error"),
                now,
                now,
            ),
        )


def create_audit_from_crawl(user_id: int, root_url: str, crawl: dict[str, Any]) -> dict[str, Any]:
    now = _now()
    url = normalize_audit_url(root_url)
    site_url = crawl.get("site_url") or url
    pages = crawl.get("pages") or []
    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO audits (
                user_id, url, name, site_url, source, sitemap_found,
                link_count, created_at, refreshed_at
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                url,
                site_url,
                crawl.get("source"),
                1 if crawl.get("sitemap_found") else 0,
                int(crawl.get("link_count") or len(pages)),
                now,
                now,
            ),
        )
        audit_id = int(cur.lastrowid)
        _insert_pages(conn, audit_id, pages, now=now)
    result = get_audit(audit_id, user_id)
    assert result is not None
    return result


def refresh_audit_from_crawl(
    audit_id: int,
    user_id: int,
    crawl: dict[str, Any],
) -> dict[str, Any]:
    """Diff crawl against saved pages. Preserve analyses; mark outdated via hash mismatch."""
    audit = get_audit(audit_id, user_id)
    if not audit:
        raise ValueError("Audit not found.")

    now = _now()
    incoming: dict[str, dict[str, Any]] = {}
    for page in crawl.get("pages") or []:
        raw_url = page.get("url")
        if not raw_url:
            continue
        try:
            url = normalize_audit_url(raw_url)
        except ValueError:
            continue
        incoming[url] = page

    summary = {"created": 0, "updated": 0, "deleted": 0, "unchanged": 0}

    with get_db() as conn:
        existing_rows = conn.execute(
            """
            SELECT id, url, content_hash, state
            FROM audit_pages
            WHERE audit_id = ?
            """,
            (audit_id,),
        ).fetchall()
        existing = {row["url"]: dict(row) for row in existing_rows}

        for url, page in incoming.items():
            content = page.get("content") or ""
            new_hash = content_hash(content)
            ok = 1 if page.get("ok") else 0
            status = page.get("status")
            error = page.get("error")

            if url not in existing:
                conn.execute(
                    """
                    INSERT INTO audit_pages (
                        audit_id, url, content, content_hash, status, ok, error, state,
                        first_seen_at, last_seen_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
                    """,
                    (audit_id, url, content, new_hash, status, ok, error, now, now),
                )
                summary["created"] += 1
                continue

            prev = existing[url]
            if prev["state"] == "deleted" or prev["content_hash"] != new_hash:
                conn.execute(
                    """
                    UPDATE audit_pages
                    SET content = ?, content_hash = ?, status = ?, ok = ?, error = ?,
                        state = 'active', last_seen_at = ?
                    WHERE id = ?
                    """,
                    (content, new_hash, status, ok, error, now, prev["id"]),
                )
                summary["updated"] += 1
            else:
                conn.execute(
                    """
                    UPDATE audit_pages
                    SET status = ?, ok = ?, error = ?, state = 'active', last_seen_at = ?
                    WHERE id = ?
                    """,
                    (status, ok, error, now, prev["id"]),
                )
                summary["unchanged"] += 1

        for url, prev in existing.items():
            if url in incoming:
                continue
            if prev["state"] == "deleted":
                continue
            conn.execute(
                """
                UPDATE audit_pages
                SET state = 'deleted', last_seen_at = ?
                WHERE id = ?
                """,
                (now, prev["id"]),
            )
            summary["deleted"] += 1

        conn.execute(
            """
            UPDATE audits
            SET site_url = ?, source = ?, sitemap_found = ?, link_count = ?, refreshed_at = ?
            WHERE id = ? AND user_id = ?
            """,
            (
                crawl.get("site_url") or audit["site_url"] or audit["url"],
                crawl.get("source"),
                1 if crawl.get("sitemap_found") else 0,
                int(crawl.get("link_count") or len(incoming)),
                now,
                audit_id,
                user_id,
            ),
        )

    snapshot = get_audit(audit_id, user_id)
    assert snapshot is not None
    return {"audit": snapshot, "changes": summary}


def save_page_aeo(
    audit_id: int,
    user_id: int,
    page_url: str,
    aeo: dict[str, Any],
) -> dict[str, Any]:
    url = normalize_audit_url(page_url)
    now = _now()
    with get_db() as conn:
        owned = conn.execute(
            "SELECT id FROM audits WHERE id = ? AND user_id = ?",
            (audit_id, user_id),
        ).fetchone()
        if not owned:
            raise ValueError("Audit not found.")
        page = conn.execute(
            "SELECT id, content_hash FROM audit_pages WHERE audit_id = ? AND url = ?",
            (audit_id, url),
        ).fetchone()
        if not page:
            raise ValueError("Page not found in this audit.")
        conn.execute(
            """
            UPDATE audit_pages
            SET aeo_json = ?, aeo_source_hash = ?, aeo_generated_at = ?
            WHERE id = ?
            """,
            (json.dumps(aeo), page["content_hash"], now, page["id"]),
        )
    snapshot = get_audit(audit_id, user_id)
    assert snapshot is not None
    page_out = next((p for p in snapshot["pages"] if p["url"] == url), None)
    assert page_out is not None
    return page_out


def save_page_ads(
    audit_id: int,
    user_id: int,
    page_url: str,
    ads: dict[str, Any],
) -> dict[str, Any]:
    url = normalize_audit_url(page_url)
    now = _now()
    image_b64 = ads.get("image_base64")
    image_bytes: bytes | None = None
    if isinstance(image_b64, str) and image_b64:
        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:  # noqa: BLE001
            image_bytes = None

    ads_meta = {k: v for k, v in ads.items() if k != "image_base64"}

    with get_db() as conn:
        owned = conn.execute(
            "SELECT id FROM audits WHERE id = ? AND user_id = ?",
            (audit_id, user_id),
        ).fetchone()
        if not owned:
            raise ValueError("Audit not found.")
        page = conn.execute(
            "SELECT id, content_hash FROM audit_pages WHERE audit_id = ? AND url = ?",
            (audit_id, url),
        ).fetchone()
        if not page:
            raise ValueError("Page not found in this audit.")
        conn.execute(
            """
            UPDATE audit_pages
            SET ads_json = ?, ads_image = ?, ads_source_hash = ?, ads_generated_at = ?
            WHERE id = ?
            """,
            (json.dumps(ads_meta), image_bytes, page["content_hash"], now, page["id"]),
        )
    snapshot = get_audit(audit_id, user_id)
    assert snapshot is not None
    page_out = next((p for p in snapshot["pages"] if p["url"] == url), None)
    assert page_out is not None
    return page_out
