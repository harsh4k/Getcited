import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, url_for

from ab_store import (
    create_experiment,
    create_site,
    experiment_report,
    get_experiment,
    get_running_experiments,
    get_site,
    get_site_by_sdk_key,
    init_db,
    insert_events,
    list_experiments,
    list_sites,
    site_overview,
    update_experiment_status,
)
from auth import (
    authenticate_user,
    create_user,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from sitemap_crawler import crawl_site


def _load_dotenv() -> None:
    """Load KEY=VALUE pairs from .env into os.environ (does not override)."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()

app = Flask(__name__)
secret = os.environ.get("GETCITED_SECRET_KEY")
if not secret:
    raise RuntimeError(
        "Set the GETCITED_SECRET_KEY environment variable before starting Flask. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
app.secret_key = secret
app.permanent_session_lifetime = timedelta(days=14)
init_db()


@app.context_processor
def inject_auth():
    return {"current_user": current_user()}


@app.after_request
def add_cors_headers(response):
    # SDK is embedded on customer sites, so collect/config need CORS.
    if request.path.startswith("/ab/collect") or request.path.startswith("/ab/config/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user():
        return redirect(url_for("home"))
    error = None
    if request.method == "POST":
        email = (request.form.get("email") or "").strip()
        password = request.form.get("password") or ""
        confirm = request.form.get("confirm") or ""
        if password != confirm:
            error = "Passwords do not match."
        else:
            try:
                user = create_user(email, password)
                login_user(user)
                return redirect(request.args.get("next") or url_for("home"))
            except ValueError as exc:
                error = str(exc)
    return render_template("register.html", error=error)


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user():
        return redirect(url_for("home"))
    error = None
    if request.method == "POST":
        email = (request.form.get("email") or "").strip()
        password = request.form.get("password") or ""
        user = authenticate_user(email, password)
        if not user:
            error = "Invalid email or password."
        else:
            login_user(user)
            return redirect(request.args.get("next") or url_for("home"))
    return render_template("login.html", error=error)


@app.route("/logout", methods=["POST", "GET"])
def logout():
    logout_user()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def home():
    return render_template("index.html")


@app.route("/ads")
@login_required
def ads_page():
    return render_template("ads.html")


@app.route("/ab")
@login_required
def ab_page():
    return render_template("ab.html")


@app.route("/crawl", methods=["POST"])
@login_required
def crawl():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or request.form.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Please enter a site URL."}), 400
    try:
        result = crawl_site(url)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Crawl failed: {exc}"}), 500
    return jsonify(result)


@app.route("/ads/analyze", methods=["POST"])
@login_required
def ads_analyze():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or request.form.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Please paste a page URL."}), 400
    try:
        # Lazy import: pulls in torch/deepgaze, which are optional heavy deps
        from ad_hotspots import analyze_ad_hotspots
    except ImportError:
        return (
            jsonify({"error": "Ads analysis is not available on this install (needs the ML stack: torch, deepgaze, playwright)."}),
            503,
        )
    try:
        result = analyze_ad_hotspots(url)
    except ValueError as exc:
        app.logger.warning("ads/analyze rejected %s: %s", url, exc)
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("ads/analyze failed for %s", url)
        return jsonify({"error": f"Analysis failed: {exc}"}), 500
    return jsonify(result)


@app.route("/ab/sites", methods=["GET", "POST"])
@login_required
def ab_sites():
    user = current_user()
    if request.method == "GET":
        return jsonify({"sites": list_sites(user["id"])})
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    url = (data.get("url") or "").strip()
    if not name or not url:
        return jsonify({"error": "Name and URL are required."}), 400
    site = create_site(user["id"], name, url)
    return jsonify(site), 201


@app.route("/ab/sites/<int:site_id>", methods=["GET"])
@login_required
def ab_site_detail(site_id: int):
    user = current_user()
    site = get_site(site_id, user["id"])
    if not site:
        return jsonify({"error": "Site not found."}), 404
    return jsonify(
        {
            "site": site,
            "experiments": list_experiments(site_id),
            "overview": site_overview(site_id),
        }
    )


@app.route("/ab/sites/<int:site_id>/experiments", methods=["POST"])
@login_required
def ab_create_experiment(site_id: int):
    user = current_user()
    site = get_site(site_id, user["id"])
    if not site:
        return jsonify({"error": "Site not found."}), 404
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    variants = data.get("variants") or []
    traffic_pct = data.get("traffic_pct", 100)
    if not name:
        return jsonify({"error": "Experiment name is required."}), 400
    try:
        experiment = create_experiment(site_id, name, variants, traffic_pct)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(experiment), 201


@app.route("/ab/experiments/<int:experiment_id>/status", methods=["POST"])
@login_required
def ab_experiment_status(experiment_id: int):
    user = current_user()
    experiment = get_experiment(experiment_id)
    if not experiment or not get_site(experiment["site_id"], user["id"]):
        return jsonify({"error": "Experiment not found."}), 404
    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip()
    try:
        updated = update_experiment_status(experiment_id, status)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(updated)


@app.route("/ab/experiments/<int:experiment_id>/report", methods=["GET"])
@login_required
def ab_experiment_report(experiment_id: int):
    user = current_user()
    experiment = get_experiment(experiment_id)
    if not experiment or not get_site(experiment["site_id"], user["id"]):
        return jsonify({"error": "Experiment not found."}), 404
    try:
        return jsonify(experiment_report(experiment_id))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404


@app.route("/ab/config/<sdk_key>", methods=["GET", "OPTIONS"])
def ab_config(sdk_key: str):
    if request.method == "OPTIONS":
        return ("", 204)
    site = get_site_by_sdk_key(sdk_key)
    if not site:
        return jsonify({"error": "Invalid SDK key."}), 404
    return jsonify(
        {
            "site_id": site["id"],
            "sdk_key": site["sdk_key"],
            "experiments": get_running_experiments(site["id"]),
        }
    )


@app.route("/ab/collect", methods=["POST", "OPTIONS"])
def ab_collect():
    if request.method == "OPTIONS":
        return ("", 204)
    data = request.get_json(silent=True) or {}
    events = data.get("events")
    if events is None and data.get("sdk_key"):
        events = [data]
    if not isinstance(events, list):
        return jsonify({"error": "Expected events array."}), 400
    accepted = insert_events(events)
    return jsonify({"accepted": accepted})


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)
