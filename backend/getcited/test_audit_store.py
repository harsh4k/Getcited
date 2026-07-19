"""Tests for audit snapshot persistence and refresh diffing."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

# Ensure backend package imports resolve when run from repo root or this folder.
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

# Isolate SQLite before importing store modules.
_fd, _DB = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["GETCITED_TEST_DB"] = _DB

import ab_store  # noqa: E402

ab_store.DB_PATH = Path(_DB)

from ab_store import get_db, init_db  # noqa: E402
from audit_store import (  # noqa: E402
    content_hash,
    create_audit_from_crawl,
    get_audit,
    list_audits,
    refresh_audit_from_crawl,
    save_page_ads,
    save_page_aeo,
)


def _crawl(pages: list[dict], site_url: str = "https://example.com") -> dict:
    return {
        "site_url": site_url,
        "sitemap_found": True,
        "source": "sitemap",
        "sitemaps": [f"{site_url}/sitemap.xml"],
        "link_count": len(pages),
        "pages": pages,
        "error": None,
    }


def _page(url: str, content: str, ok: bool = True) -> dict:
    return {
        "url": url,
        "ok": ok,
        "status": 200 if ok else 404,
        "content": content,
        "error": None if ok else "missing",
    }


class AuditStoreTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        init_db()
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                ("audit-test@getcited.dev", "", "2026-01-01T00:00:00+00:00"),
            )
            cls.user_id = int(cur.lastrowid)
            cur2 = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                ("other@getcited.dev", "", "2026-01-01T00:00:00+00:00"),
            )
            cls.other_user = int(cur2.lastrowid)

    def test_create_and_list_roundtrip(self) -> None:
        audit = create_audit_from_crawl(
            self.user_id,
            "https://example.com",
            _crawl(
                [
                    _page("https://example.com/", "Home page content " * 10),
                    _page("https://example.com/about", "About page content " * 10),
                ]
            ),
        )
        self.assertEqual(audit["user_id"], self.user_id)
        self.assertEqual(audit["active_page_count"], 2)
        listed = list_audits(self.user_id)
        self.assertTrue(any(a["id"] == audit["id"] for a in listed))
        self.assertEqual(list_audits(self.other_user), [])
        fetched = get_audit(audit["id"], self.user_id)
        assert fetched is not None
        self.assertEqual(len(fetched["pages"]), 2)
        self.assertIsNone(get_audit(audit["id"], self.other_user))

    def test_refresh_create_update_delete_unchanged(self) -> None:
        audit = create_audit_from_crawl(
            self.user_id,
            "https://refresh.example",
            _crawl(
                [
                    _page("https://refresh.example/", "Same content forever " * 8),
                    _page("https://refresh.example/old", "Will be deleted " * 8),
                    _page("https://refresh.example/change", "Original text " * 8),
                ],
                site_url="https://refresh.example",
            ),
        )
        aeo = {
            "url": "https://refresh.example/change",
            "analysis": {"mainTopic": "Original"},
            "questions": None,
            "queries": None,
            "optimizedWriteup": "# Original writeup",
        }
        save_page_aeo(audit["id"], self.user_id, "https://refresh.example/change", aeo)
        ads = {
            "final_url": "https://refresh.example/change",
            "hotspot_count": 1,
            "hotspots": [],
            "image_base64": "aGVsbG8=",  # "hello"
            "warning": None,
            "error": None,
        }
        save_page_ads(audit["id"], self.user_id, "https://refresh.example/change", ads)

        result = refresh_audit_from_crawl(
            audit["id"],
            self.user_id,
            _crawl(
                [
                    _page("https://refresh.example/", "Same content forever " * 8),
                    _page("https://refresh.example/change", "Changed text now " * 8),
                    _page("https://refresh.example/new", "Brand new page " * 8),
                ],
                site_url="https://refresh.example",
            ),
        )
        changes = result["changes"]
        self.assertEqual(changes["created"], 1)
        self.assertEqual(changes["updated"], 1)
        self.assertEqual(changes["deleted"], 1)
        self.assertEqual(changes["unchanged"], 1)

        pages = {p["url"]: p for p in result["audit"]["pages"]}
        self.assertEqual(pages["https://refresh.example/old"]["state"], "deleted")
        self.assertIn("https://refresh.example/new", pages)
        changed = pages["https://refresh.example/change"]
        self.assertTrue(changed["aeo_outdated"])
        self.assertTrue(changed["ads_outdated"])
        self.assertIsNotNone(changed["aeo"])
        self.assertEqual(changed["aeo"]["optimizedWriteup"], "# Original writeup")
        self.assertIsNotNone(changed["ads"])
        self.assertEqual(changed["ads"]["image_base64"], "aGVsbG8=")
        self.assertEqual(
            changed["content_hash"],
            content_hash("Changed text now " * 8),
        )

        # Unchanged page keeps analyses not outdated
        home = pages["https://refresh.example/"]
        self.assertFalse(home["aeo_outdated"])


if __name__ == "__main__":
    unittest.main()
