# GetCited

Session auth required for the dashboard. SDK collect/config stay public so
embedded scripts keep working.

## Auth
`/register` · `/login` · `/logout` — email + password accounts. Sites and SDK
keys are scoped to the signed-in user.

## Sitemap Crawler
`/` — enter a site URL, find sitemap (or same-domain links), fetch page content.

## Ad Hotspots
`/ads` — paste a page URL, capture a full-page snapshot, run the official
pretrained DeepGaze I model over overlapping viewport tiles, overlay the
pixel-wise attention heatmap, exclude protected DOM regions, and rank safe
standard-size ad placements.

## A/B Testing
`/ab` — create a site to get a unique SDK snippet. Paste it in your site
`<head>`; the SDK tracks pageviews, clicks, scroll, engagement, and
experiment assignments. Create A/B experiments from the dashboard.

```bash
cd /Users/jatinjha/Documents/getcited
.venv/bin/pip install -r requirements.txt
.venv/bin/playwright install chromium
.venv/bin/python app.py
```

Optional: set `GETCITED_SECRET_KEY` for stable sessions across restarts.

Open http://127.0.0.1:5001/register then use `/`, `/ads`, and `/ab`.
