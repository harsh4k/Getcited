from __future__ import annotations

import re
import sqlite3
from functools import wraps

from flask import jsonify, redirect, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from ab_store import get_db, _now

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def create_user(email: str, password: str) -> dict:
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    password_hash = generate_password_hash(password)
    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                (email, password_hash, _now()),
            )
            user_id = cur.lastrowid
    except sqlite3.IntegrityError as exc:
        raise ValueError("An account with that email already exists.") from exc
    return get_user(user_id)


def authenticate_user(email: str, password: str) -> dict | None:
    email = email.strip().lower()
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    if not row:
        return None
    if not check_password_hash(row["password_hash"], password):
        return None
    return {"id": row["id"], "email": row["email"], "created_at": row["created_at"]}


def get_user(user_id: int) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return dict(row) if row else None


def get_or_create_user_by_email(email: str) -> dict | None:
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        if row:
            return dict(row)
        cur = conn.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, "", _now()),
        )
        user_id = cur.lastrowid
    return get_user(user_id)


def current_user() -> dict | None:
    user_id = session.get("user_id")
    if user_id:
        return get_user(int(user_id))
    # ponytail: header-trusted identity — Flask binds to 127.0.0.1 and is only
    # reached through the Next.js proxy, which sets this from the verified
    # Supabase session. Swap for signed tokens if Flask is ever exposed.
    email = request.headers.get("X-User-Email")
    if email:
        return get_or_create_user_by_email(email)
    return None


def login_user(user: dict) -> None:
    session.clear()
    session["user_id"] = user["id"]
    session.permanent = True


def logout_user() -> None:
    session.clear()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if not user:
            if request.path.startswith("/ab/") or request.path.startswith("/crawl") or request.path.startswith("/ads/"):
                return jsonify({"error": "Authentication required."}), 401
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)

    return wrapped
