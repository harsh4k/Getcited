from __future__ import annotations

import json
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "getcited.db"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        _migrate_sites_user_id(conn)
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                sdk_key TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS experiments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                traffic_pct INTEGER NOT NULL DEFAULT 100,
                variants_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_id INTEGER NOT NULL,
                sdk_key TEXT NOT NULL,
                anonymous_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                path TEXT,
                url TEXT,
                referrer TEXT,
                experiment_id TEXT,
                variant TEXT,
                properties_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
            CREATE INDEX IF NOT EXISTS idx_events_site ON events(site_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_events_type ON events(site_id, event_type);
            CREATE INDEX IF NOT EXISTS idx_events_anon ON events(anonymous_id);
            """
        )
        _purge_demo_data(conn)
        from audit_store import init_audit_tables

        init_audit_tables(conn)


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table,),
    ).fetchone()
    return row is not None


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    if not _table_exists(conn, table):
        return set()
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {row["name"] for row in rows}


def _migrate_sites_user_id(conn: sqlite3.Connection) -> None:
    if not _table_exists(conn, "sites"):
        return
    columns = _table_columns(conn, "sites")
    if "user_id" in columns:
        return
    # Legacy schema without ownership — rebuild empty tables (demo data discarded).
    conn.executescript(
        """
        DROP TABLE IF EXISTS events;
        DROP TABLE IF EXISTS experiments;
        DROP TABLE IF EXISTS sites;
        """
    )


def _purge_demo_data(conn: sqlite3.Connection) -> None:
    """Remove smoke-test / placeholder sites left from earlier development."""
    demo_patterns = (
        "%example.com%",
        "%demo.test%",
        "%smoke.test%",
        "Demo",
        "Live Test",
        "AB Smoke",
        "Marketing site",
    )
    clauses = " OR ".join(["url LIKE ?" ] * 3 + ["name = ?"] * 4)
    params = demo_patterns
    site_ids = [
        row["id"]
        for row in conn.execute(
            f"SELECT id FROM sites WHERE {clauses}",
            params,
        ).fetchall()
    ]
    if not site_ids:
        return
    placeholders = ",".join("?" * len(site_ids))
    conn.execute(f"DELETE FROM events WHERE site_id IN ({placeholders})", site_ids)
    conn.execute(f"DELETE FROM experiments WHERE site_id IN ({placeholders})", site_ids)
    conn.execute(f"DELETE FROM sites WHERE id IN ({placeholders})", site_ids)


def create_site(user_id: int, name: str, url: str) -> dict:
    sdk_key = f"sdk_{secrets.token_hex(12)}"
    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO sites (user_id, name, url, sdk_key, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, name.strip(), url.strip(), sdk_key, _now()),
        )
        site_id = cur.lastrowid
    return get_site(site_id)


def list_sites(user_id: int) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, user_id, name, url, sdk_key, created_at
            FROM sites WHERE user_id = ? ORDER BY id DESC
            """,
            (user_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_site(site_id: int, user_id: int | None = None) -> dict | None:
    with get_db() as conn:
        if user_id is None:
            row = conn.execute(
                "SELECT id, user_id, name, url, sdk_key, created_at FROM sites WHERE id = ?",
                (site_id,),
            ).fetchone()
        else:
            row = conn.execute(
                """
                SELECT id, user_id, name, url, sdk_key, created_at
                FROM sites WHERE id = ? AND user_id = ?
                """,
                (site_id, user_id),
            ).fetchone()
    return dict(row) if row else None


def get_site_by_sdk_key(sdk_key: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, user_id, name, url, sdk_key, created_at FROM sites WHERE sdk_key = ?",
            (sdk_key,),
        ).fetchone()
    return dict(row) if row else None


def rename_site(site_id: int, user_id: int, name: str) -> dict | None:
    cleaned = name.strip()
    if not cleaned:
        raise ValueError("Name is required.")
    site = get_site(site_id, user_id)
    if not site:
        return None
    with get_db() as conn:
        conn.execute(
            "UPDATE sites SET name = ? WHERE id = ? AND user_id = ?",
            (cleaned, site_id, user_id),
        )
    return get_site(site_id, user_id)


def delete_site(site_id: int, user_id: int) -> bool:
    site = get_site(site_id, user_id)
    if not site:
        return False
    with get_db() as conn:
        # Cascades cover experiments/events when foreign_keys pragma is on;
        # delete children explicitly so cleanup is reliable either way.
        conn.execute("DELETE FROM events WHERE site_id = ?", (site_id,))
        conn.execute("DELETE FROM experiments WHERE site_id = ?", (site_id,))
        conn.execute("DELETE FROM sites WHERE id = ? AND user_id = ?", (site_id, user_id))
    return True


def create_experiment(
    site_id: int,
    name: str,
    variants: list[dict],
    traffic_pct: int = 100,
) -> dict:
    if not variants or len(variants) < 2:
        raise ValueError("An experiment needs at least 2 variants.")
    traffic_pct = max(1, min(100, int(traffic_pct)))
    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO experiments (site_id, name, status, traffic_pct, variants_json, created_at)
            VALUES (?, ?, 'running', ?, ?, ?)
            """,
            (site_id, name.strip(), traffic_pct, json.dumps(variants), _now()),
        )
        exp_id = cur.lastrowid
    return get_experiment(exp_id)


def list_experiments(site_id: int) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, site_id, name, status, traffic_pct, variants_json, created_at
            FROM experiments WHERE site_id = ? ORDER BY id DESC
            """,
            (site_id,),
        ).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["variants"] = json.loads(item.pop("variants_json"))
        result.append(item)
    return result


def get_experiment(experiment_id: int) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT id, site_id, name, status, traffic_pct, variants_json, created_at
            FROM experiments WHERE id = ?
            """,
            (experiment_id,),
        ).fetchone()
    if not row:
        return None
    item = dict(row)
    item["variants"] = json.loads(item.pop("variants_json"))
    return item


def get_running_experiments(site_id: int) -> list[dict]:
    return [exp for exp in list_experiments(site_id) if exp["status"] == "running"]


def update_experiment_status(experiment_id: int, status: str) -> dict | None:
    if status not in {"draft", "running", "paused", "completed"}:
        raise ValueError("Invalid experiment status.")
    with get_db() as conn:
        conn.execute(
            "UPDATE experiments SET status = ? WHERE id = ?",
            (status, experiment_id),
        )
    return get_experiment(experiment_id)


def insert_events(events: list[dict]) -> int:
    if not events:
        return 0
    rows = []
    for event in events:
        site = get_site_by_sdk_key(event["sdk_key"])
        if not site:
            continue
        rows.append(
            (
                site["id"],
                event["sdk_key"],
                event.get("anonymous_id") or "unknown",
                event.get("session_id") or "unknown",
                event.get("event_type") or "custom",
                event.get("path"),
                event.get("url"),
                event.get("referrer"),
                event.get("experiment_id"),
                event.get("variant"),
                json.dumps(event.get("properties") or {}),
                _now(),
            )
        )
    if not rows:
        return 0
    with get_db() as conn:
        conn.executemany(
            """
            INSERT INTO events (
                site_id, sdk_key, anonymous_id, session_id, event_type,
                path, url, referrer, experiment_id, variant, properties_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
    return len(rows)


def site_overview(site_id: int) -> dict:
    with get_db() as conn:
        totals = conn.execute(
            """
            SELECT
                COUNT(*) AS events,
                COUNT(DISTINCT anonymous_id) AS users,
                COUNT(DISTINCT session_id) AS sessions
            FROM events WHERE site_id = ?
            """,
            (site_id,),
        ).fetchone()
        by_type = conn.execute(
            """
            SELECT event_type, COUNT(*) AS count
            FROM events WHERE site_id = ?
            GROUP BY event_type ORDER BY count DESC
            """,
            (site_id,),
        ).fetchall()
        recent = conn.execute(
            """
            SELECT event_type, path, anonymous_id, session_id, experiment_id, variant, created_at
            FROM events WHERE site_id = ?
            ORDER BY id DESC LIMIT 40
            """,
            (site_id,),
        ).fetchall()
        top_paths = conn.execute(
            """
            SELECT path, COUNT(*) AS count
            FROM events
            WHERE site_id = ? AND event_type = 'pageview' AND path IS NOT NULL
            GROUP BY path ORDER BY count DESC LIMIT 10
            """,
            (site_id,),
        ).fetchall()
    return {
        "totals": dict(totals),
        "by_type": [dict(row) for row in by_type],
        "recent": [dict(row) for row in recent],
        "top_paths": [dict(row) for row in top_paths],
    }


def experiment_report(experiment_id: int) -> dict:
    exp = get_experiment(experiment_id)
    if not exp:
        raise ValueError("Experiment not found.")
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT
                variant,
                COUNT(*) AS events,
                COUNT(DISTINCT anonymous_id) AS users,
                SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
                SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks,
                SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END) AS conversions
            FROM events
            WHERE site_id = ? AND experiment_id = ?
            GROUP BY variant
            """,
            (exp["site_id"], str(experiment_id)),
        ).fetchall()
    variants = []
    for row in rows:
        item = dict(row)
        users = item["users"] or 0
        conversions = item["conversions"] or 0
        item["conversion_rate"] = round(conversions / users, 4) if users else 0.0
        variants.append(item)
    return {"experiment": exp, "variants": variants}
