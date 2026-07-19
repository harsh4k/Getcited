from __future__ import annotations

import base64
import io
import re
import threading
from dataclasses import dataclass
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright

from saliency_model import (
    build_safe_mask,
    predict_saliency,
    recommend_slots,
    render_heatmap,
)

VIEWPORT = {"width": 1440, "height": 900}
MAX_HOTSPOTS = 8
NAV_TIMEOUT_MS = 45_000
SETTLE_TIMEOUT_MS = 15_000
# Chromium full-page screenshots silently clip beyond ~16k px; stitch below that.
MAX_SINGLE_SHOT_HEIGHT = 14_000
MAX_SCROLL_STEPS = 60

# Playwright sync API is not safe across threads; serialize captures.
_ANALYZE_LOCK = threading.Lock()

# Common IAB-ish ad slot sizes we try to fit (w, h, label)
AD_SLOTS = (
    (728, 90, "Leaderboard"),
    (970, 90, "Large leaderboard"),
    (300, 250, "Medium rectangle"),
    (336, 280, "Large rectangle"),
    (160, 600, "Wide skyscraper"),
    (300, 600, "Half page"),
    (320, 50, "Mobile banner"),
    (970, 250, "Billboard"),
)


def normalize_page_url(raw: str) -> str:
    """Accept full page URLs or bare hosts; keep path when provided."""
    url = raw.strip()
    if not url:
        raise ValueError("URL is required")
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise ValueError("Invalid URL")
    path = parsed.path or "/"
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{parsed.scheme}://{parsed.netloc}{path}{query}"


@dataclass
class Hotspot:
    x: int
    y: int
    width: int
    height: int
    score: float
    label: str
    reason: str

    def as_dict(self) -> dict:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "score": round(self.score, 2),
            "label": self.label,
            "reason": self.reason,
        }


def _overlaps(a: Hotspot, b: Hotspot, pad: int = 12) -> bool:
    return not (
        a.x + a.width + pad <= b.x
        or b.x + b.width + pad <= a.x
        or a.y + a.height + pad <= b.y
        or b.y + b.height + pad <= a.y
    )


def _clamp_slot(x: int, y: int, w: int, h: int, page_w: int, page_h: int) -> tuple[int, int, int, int] | None:
    if w > page_w - 40 or h > page_h - 40:
        return None
    x = max(20, min(x, page_w - w - 20))
    y = max(20, min(y, page_h - h - 20))
    if y + h > page_h - 10 or x + w > page_w - 10:
        return None
    return x, y, w, h


def _score_region(y: int, w: int, h: int, page_h: int, slot_label: str, gap_quality: float) -> float:
    # Prefer above-the-fold and large clear gaps
    fold = 900
    fold_bonus = 1.35 if y < fold else (1.15 if y < fold * 2 else 0.85)
    size_bonus = min(w, 970) / 970 * 0.5 + min(h, 600) / 600 * 0.35
    label_bonus = {
        "Leaderboard": 0.25,
        "Large leaderboard": 0.2,
        "Billboard": 0.22,
        "Medium rectangle": 0.3,
        "Large rectangle": 0.28,
        "Half page": 0.18,
        "Wide skyscraper": 0.15,
        "Mobile banner": 0.05,
    }.get(slot_label, 0.1)
    return (gap_quality * 1.2 + size_bonus + label_bonus) * fold_bonus


LAYOUT_SCRIPT = """
() => {
  const pageWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0,
    document.documentElement.clientWidth
  );
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0,
    document.documentElement.clientHeight
  );

  const blocked = [];
  const addBlocked = (el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const left = r.left + window.scrollX;
    if (r.width < 40 || r.height < 20) return;
    blocked.push({
      x: Math.round(left),
      y: Math.round(top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      tag: (el.tagName || "").toLowerCase(),
    });
  };

  document.querySelectorAll("header, nav, footer, form, button, input, textarea, select, video, iframe, [role='button'], [role='navigation'], [role='banner'], [role='contentinfo']")
    .forEach(addBlocked);

  // Protect primary headings without blanketing every paragraph/link.
  document.querySelectorAll("h1, h2").forEach(addBlocked);
  document.querySelectorAll("img, picture").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width >= 120 && r.height >= 80) addBlocked(el);
  });

  // Major layout blocks for gap detection
  const blocks = [];
  const candidates = document.querySelectorAll("header, nav, main, section, article, aside, footer, .container, [class*='hero'], [class*='section']");
  candidates.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 40) return;
    blocks.push({
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      tag: (el.tagName || "").toLowerCase(),
    });
  });

  // Also sample direct children of body for structure
  Array.from(document.body ? document.body.children : []).forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none") return;
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 30) return;
    blocks.push({
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      tag: (el.tagName || "").toLowerCase(),
    });
  });

  let headerBottom = 80;
  const header = document.querySelector("header, [role='banner'], nav");
  if (header) {
    const r = header.getBoundingClientRect();
    headerBottom = Math.round(r.bottom + window.scrollY);
  }

  let footerTop = pageHeight;
  const footer = document.querySelector("footer");
  if (footer) {
    const r = footer.getBoundingClientRect();
    footerTop = Math.round(r.top + window.scrollY);
  }

  // Side columns: elements that look like asides
  const asides = [];
  document.querySelectorAll("aside, [class*='sidebar'], [class*='side-bar']").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width >= 140 && r.width <= 420 && r.height >= 200) {
      asides.push({
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
  });

  return {
    pageWidth,
    pageHeight,
    headerBottom,
    footerTop,
    blocks,
    blocked,
    asides,
    viewportHeight: window.innerHeight,
  };
}
"""


def _gap_candidates(layout: dict) -> list[tuple[int, int, int, int, float, str]]:
    """Return list of (x, y, w, h, quality, reason)."""
    page_w = int(layout["pageWidth"])
    page_h = int(layout["pageHeight"])
    header_bottom = int(layout["headerBottom"])
    footer_top = int(layout["footerTop"])
    gaps: list[tuple[int, int, int, int, float, str]] = []

    # 1) Banner strip just under header
    banner_y = max(header_bottom + 8, 60)
    gaps.append((40, banner_y, min(page_w - 80, 970), 90, 0.95, "Below header — high visibility"))

    # 2) Vertical gaps between sorted content blocks
    blocks = sorted(layout.get("blocks") or [], key=lambda b: (b["y"], b["x"]))
    content_blocks = [b for b in blocks if b["w"] >= page_w * 0.45]
    for i in range(len(content_blocks) - 1):
        a, b = content_blocks[i], content_blocks[i + 1]
        gap_top = a["y"] + a["h"]
        gap_bottom = b["y"]
        gap_h = gap_bottom - gap_top
        if gap_h < 100:
            continue
        x = max(a["x"], 40)
        w = min(a["w"], b["w"], page_w - x - 40)
        if w < 280:
            continue
        # Place a slot inside the gap
        y = gap_top + max(12, (gap_h - 250) // 2)
        gaps.append((x, y, min(w, 970), min(gap_h - 24, 280), min(1.0, gap_h / 300), "Content gap between sections"))

    # 3) Aside / sidebar regions
    for aside in layout.get("asides") or []:
        gaps.append(
            (
                aside["x"] + 8,
                aside["y"] + 24,
                max(160, aside["w"] - 16),
                min(600, aside["h"] - 48),
                0.8,
                "Sidebar column",
            )
        )

    # 4) Mid-page content rectangle (centered)
    mid_y = max(header_bottom + 200, int(page_h * 0.28))
    gaps.append(((page_w - 300) // 2, mid_y, 300, 250, 0.7, "Mid-page attention zone"))

    # 5) Pre-footer strip
    if footer_top > header_bottom + 400:
        y = max(footer_top - 140, int(page_h * 0.75))
        gaps.append((40, y, min(page_w - 80, 970), 90, 0.65, "Above footer"))

    # 6) Right rail if page is wide
    if page_w >= 1200:
        gaps.append((page_w - 340, header_bottom + 40, 300, 600, 0.75, "Right rail"))

    return gaps


def _fits_in_blocked(x: int, y: int, w: int, h: int, blocked: list[dict]) -> bool:
    """True if the proposed slot heavily overlaps important UI."""
    slot_area = w * h
    for b in blocked:
        ix1 = max(x, b["x"])
        iy1 = max(y, b["y"])
        ix2 = min(x + w, b["x"] + b["w"])
        iy2 = min(y + h, b["y"] + b["h"])
        if ix2 <= ix1 or iy2 <= iy1:
            continue
        overlap = (ix2 - ix1) * (iy2 - iy1)
        if overlap / slot_area > 0.35:
            return True
        # Don't cover headings / nav much
        if b.get("tag") in {"header", "nav", "h1", "h2", "form", "button"} and overlap / slot_area > 0.15:
            return True
    return False


def find_hotspots(layout: dict) -> list[Hotspot]:
    page_w = int(layout["pageWidth"])
    page_h = int(layout["pageHeight"])
    blocked = layout.get("blocked") or []
    candidates: list[Hotspot] = []

    for gx, gy, gw, gh, quality, reason in _gap_candidates(layout):
        # Try to fit the best matching ad slot inside this gap
        fitted = False
        for sw, sh, label in sorted(AD_SLOTS, key=lambda s: s[0] * s[1], reverse=True):
            if sw > gw + 20 or sh > gh + 20:
                continue
            x = gx + max(0, (gw - sw) // 2)
            y = gy + max(0, (gh - sh) // 2)
            clamped = _clamp_slot(x, y, sw, sh, page_w, page_h)
            if not clamped:
                continue
            x, y, w, h = clamped
            if _fits_in_blocked(x, y, w, h, blocked):
                continue
            score = _score_region(y, w, h, page_h, label, quality)
            candidates.append(Hotspot(x, y, w, h, score, label, reason))
            fitted = True
            break
        if not fitted and gw >= 280 and gh >= 90:
            clamped = _clamp_slot(gx, gy, min(gw, 728), min(gh, 250), page_w, page_h)
            if clamped and not _fits_in_blocked(*clamped, blocked):
                x, y, w, h = clamped
                candidates.append(
                    Hotspot(x, y, w, h, _score_region(y, w, h, page_h, "Medium rectangle", quality), "Custom slot", reason)
                )

    # Greedy non-overlapping selection by score
    candidates.sort(key=lambda h: h.score, reverse=True)
    selected: list[Hotspot] = []
    for hot in candidates:
        if any(_overlaps(hot, s) for s in selected):
            continue
        selected.append(hot)
        if len(selected) >= MAX_HOTSPOTS:
            break

    # Rank labels 1..n by score order
    for i, hot in enumerate(selected, start=1):
        hot.label = f"#{i} {hot.label}"
    return selected


def _draw_hotspots(image: Image.Image, hotspots: list[Hotspot]) -> Image.Image:
    img = image.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 18)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
        font_small = font

    colors = [
        (15, 118, 110, 70),
        (180, 83, 9, 70),
        (126, 34, 206, 70),
        (185, 28, 28, 70),
        (29, 78, 216, 70),
        (22, 163, 74, 70),
        (219, 39, 119, 70),
        (8, 145, 178, 70),
    ]
    border = [
        (15, 118, 110, 230),
        (180, 83, 9, 230),
        (126, 34, 206, 230),
        (185, 28, 28, 230),
        (29, 78, 216, 230),
        (22, 163, 74, 230),
        (219, 39, 119, 230),
        (8, 145, 178, 230),
    ]

    for i, hot in enumerate(hotspots):
        fill = colors[i % len(colors)]
        stroke = border[i % len(border)]
        box = [hot.x, hot.y, hot.x + hot.width, hot.y + hot.height]
        draw.rectangle(box, fill=fill, outline=stroke, width=4)
        caption = f"{hot.label}  ({hot.width}×{hot.height})"
        # Label background
        ty = max(8, hot.y - 28)
        text_box = draw.textbbox((hot.x, ty), caption, font=font)
        pad = 6
        draw.rectangle(
            [text_box[0] - pad, text_box[1] - pad, text_box[2] + pad, text_box[3] + pad],
            fill=(28, 25, 23, 220),
        )
        draw.text((hot.x, ty), caption, fill=(255, 255, 255, 255), font=font)
        draw.text((hot.x + 6, hot.y + 8), hot.reason, fill=(255, 255, 255, 230), font=font_small)

    return Image.alpha_composite(img, overlay).convert("RGB")


def _wait_for_page_ready(page) -> None:
    """Scroll and force-paint so lazy / animated sections appear in the screenshot."""
    try:
        page.wait_for_load_state("networkidle", timeout=SETTLE_TIMEOUT_MS)
    except PlaywrightTimeout:
        try:
            page.wait_for_load_state("load", timeout=8_000)
        except PlaywrightTimeout:
            pass

    try:
        page.evaluate("async () => { if (document.fonts) await document.fonts.ready; }")
    except Exception:  # noqa: BLE001
        pass

    # Dismiss common consent / overlay blockers that hide page content.
    page.evaluate(
        """
        () => {
          const clickTexts = [
            'accept', 'accept all', 'accept cookies', 'agree', 'i agree',
            'got it', 'allow all', 'allow cookies', 'continue', 'ok',
          ];
          const nodes = Array.from(
            document.querySelectorAll('button, [role="button"], a, input[type="button"]')
          );
          for (const el of nodes) {
            const label = ((el.innerText || el.textContent || el.getAttribute('aria-label') || '') + '')
              .trim()
              .toLowerCase();
            if (!label || label.length > 40) continue;
            if (clickTexts.some((t) => label === t || label.includes(t))) {
              try { el.click(); } catch (_) {}
              break;
            }
          }
          document
            .querySelectorAll('[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i]')
            .forEach((el) => {
              const style = window.getComputedStyle(el);
              if (style.position === 'fixed' || style.position === 'sticky') {
                el.style.setProperty('display', 'none', 'important');
              }
            });
        }
        """
    )

    page.evaluate(
        """
        () => {
          // Eager-load lazy media and CSS content-visibility blank regions.
          const style = document.createElement('style');
          style.setAttribute('data-getcited', 'force-paint');
          style.textContent = `
            *, *::before, *::after {
              content-visibility: visible !important;
              animation-delay: 0s !important;
              animation-duration: 0s !important;
              transition: none !important;
              scroll-behavior: auto !important;
            }
            html { scroll-behavior: auto !important; }
          `;
          document.head.appendChild(style);

          document.querySelectorAll('img[loading="lazy"], img[data-src], img[data-lazy-src]').forEach((img) => {
            img.loading = 'eager';
            img.removeAttribute('loading');
            const ds = img.dataset || {};
            if (ds.src && (!img.src || img.src.startsWith('data:'))) img.src = ds.src;
            if (ds.lazySrc && (!img.src || img.src.startsWith('data:'))) img.src = ds.lazySrc;
            if (ds.srcset && !img.srcset) img.srcset = ds.srcset;
            if (ds.original && (!img.src || img.src.startsWith('data:'))) img.src = ds.original;
          });
          document.querySelectorAll('source[data-srcset], source[data-src]').forEach((s) => {
            if (s.dataset.srcset && !s.srcset) s.srcset = s.dataset.srcset;
            if (s.dataset.src && !s.src) s.src = s.dataset.src;
          });
          document.querySelectorAll('video[data-src], iframe[data-src]').forEach((el) => {
            if (el.dataset.src && !el.src) el.src = el.dataset.src;
          });
          document.querySelectorAll('[style*="background"]').forEach((el) => {
            // Nudge background-image paint after scroll
            const bg = el.style.backgroundImage;
            if (bg) el.style.backgroundImage = bg;
          });
        }
        """
    )

    # Progressive scroll — triggers IntersectionObserver / lazy sections on tall pages.
    page.evaluate(
        f"""
        async () => {{
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const getHeight = () =>
            Math.max(
              document.body ? document.body.scrollHeight : 0,
              document.documentElement.scrollHeight,
              document.documentElement.clientHeight
            );

          let height = getHeight();
          const step = Math.max(350, Math.floor(window.innerHeight * 0.7));
          let guard = 0;
          for (let y = 0; y < height + step && guard < {MAX_SCROLL_STEPS}; y += step, guard++) {{
            window.scrollTo({{ top: y, left: 0, behavior: 'instant' }});
            await sleep(160);
            height = getHeight();
          }}
          window.scrollTo({{ top: 0, left: 0, behavior: 'instant' }});
          await sleep(250);
        }}
        """
    )

    # Force common "reveal on scroll" / Framer / AOS patterns to visible.
    page.evaluate(
        """
        () => {
          const revealSelectors = [
            '[data-aos]',
            '.aos-init',
            '.reveal',
            '.fade-in',
            '.fadeIn',
            '.fade-up',
            '.slide-up',
            '[data-animate]',
            '[data-framer-appear-id]',
            '[data-framer-component-type]',
            '[class*="animate-"]',
            '[class*="Animate"]',
            '.opacity-0',
            '[style*="opacity: 0"]',
            '[style*="opacity:0"]',
          ];
          document.querySelectorAll(revealSelectors.join(',')).forEach((el) => {
            el.classList.add('aos-animate', 'is-visible', 'in-view', 'visible', 'show');
            el.classList.remove('opacity-0', 'invisible', 'hidden');
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('transform', 'none', 'important');
            el.style.setProperty('filter', 'none', 'important');
            el.style.setProperty('clip-path', 'none', 'important');
          });

          // Catch remaining laid-out but invisible blocks (animation left them at opacity 0).
          document.querySelectorAll('main *, section *, article *, header *, footer *').forEach((el) => {
            const style = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width < 8 || r.height < 8) return;
            const opacity = parseFloat(style.opacity || '1');
            if (opacity === 0 || style.visibility === 'hidden') {
              el.style.setProperty('opacity', '1', 'important');
              el.style.setProperty('visibility', 'visible', 'important');
              el.style.setProperty('transform', 'none', 'important');
            }
          });
        }
        """
    )

    page.evaluate(
        """
        async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const imgs = Array.from(document.images || []).slice(0, 120);
          await Promise.race([
            Promise.all(
              imgs.map((img) => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise((resolve) => {
                  const done = () => resolve();
                  img.addEventListener('load', done, { once: true });
                  img.addEventListener('error', done, { once: true });
                  if (img.decode) img.decode().then(done).catch(done);
                });
              })
            ),
            sleep(6000),
          ]);
        }
        """
    )

    page.wait_for_timeout(400)


def _capture_full_page(page) -> bytes:
    """Capture the full page, stitching viewport shots when height exceeds Chromium limits."""
    metrics = page.evaluate(
        """
        () => ({
          width: Math.max(
            document.documentElement.scrollWidth,
            document.body ? document.body.scrollWidth : 0,
            document.documentElement.clientWidth
          ),
          height: Math.max(
            document.documentElement.scrollHeight,
            document.body ? document.body.scrollHeight : 0,
            document.documentElement.clientHeight
          ),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          dpr: window.devicePixelRatio || 1,
        })
        """
    )
    page_h = int(metrics.get("height") or 0)
    if page_h <= MAX_SINGLE_SHOT_HEIGHT:
        return page.screenshot(full_page=True, type="png")

    viewport_h = max(int(metrics.get("viewportHeight") or VIEWPORT["height"]), 1)
    # Hide sticky/fixed chrome that would repeat in every stitch tile.
    page.evaluate(
        """
        () => {
          window.__getcitedFixed = [];
          document.querySelectorAll('*').forEach((el) => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              window.__getcitedFixed.push([el, el.style.getPropertyValue('visibility')]);
              el.style.setProperty('visibility', 'hidden', 'important');
            }
          });
        }
        """
    )
    tiles: list[Image.Image] = []
    try:
        y = 0
        while y < page_h:
            page.evaluate(f"window.scrollTo(0, {y})")
            page.wait_for_timeout(120)
            shot = page.screenshot(type="png", full_page=False)
            tiles.append(Image.open(io.BytesIO(shot)).convert("RGB"))
            y += viewport_h
            if len(tiles) > 40:
                break
    finally:
        page.evaluate(
            """
            () => {
              (window.__getcitedFixed || []).forEach(([el, prev]) => {
                if (prev) el.style.setProperty('visibility', prev);
                else el.style.removeProperty('visibility');
              });
              window.scrollTo(0, 0);
            }
            """
        )

    if not tiles:
        return page.screenshot(full_page=True, type="png")

    scale = tiles[0].height / float(viewport_h)
    canvas_h = max(tiles[0].height, int(page_h * scale))
    canvas = Image.new("RGB", (tiles[0].width, canvas_h))
    offset = 0
    remaining = canvas.height
    for tile in tiles:
        crop_h = min(tile.height, remaining)
        if crop_h <= 0:
            break
        if crop_h < tile.height:
            tile = tile.crop((0, 0, tile.width, crop_h))
        canvas.paste(tile, (0, offset))
        offset += crop_h
        remaining -= crop_h
        if remaining <= 0:
            break

    # Restore fixed/sticky header on the top strip for a natural look.
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(100)
    top = Image.open(io.BytesIO(page.screenshot(type="png", full_page=False))).convert("RGB")
    header_h = min(top.height, int(180 * scale))
    canvas.paste(top.crop((0, 0, top.width, header_h)), (0, 0))

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def analyze_ad_hotspots(raw_url: str) -> dict:
    url = normalize_page_url(raw_url)
    final_url = url

    with _ANALYZE_LOCK:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"],
                )
                context = browser.new_context(
                    viewport=VIEWPORT,
                    device_scale_factor=1,
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/131.0.0.0 Safari/537.36"
                    ),
                    locale="en-US",
                    java_script_enabled=True,
                )
                page = context.new_page()
                page.add_init_script(
                    "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
                )
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
                    _wait_for_page_ready(page)
                    final_url = page.url
                    layout = page.evaluate(LAYOUT_SCRIPT)
                    screenshot_bytes = _capture_full_page(page)
                except PlaywrightTimeout as exc:
                    raise ValueError(f"Timed out loading page: {exc}") from exc
                finally:
                    context.close()
                    browser.close()
        except ValueError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"Could not capture page: {exc}") from exc

    image = Image.open(io.BytesIO(screenshot_bytes))
    blocked = layout.get("blocked") or []
    scale = 1.0
    if image.width != layout["pageWidth"] and layout["pageWidth"] > 0:
        scale = image.width / float(layout["pageWidth"])
        blocked = [
            {
                **region,
                "x": int(region["x"] * scale),
                "y": int(region["y"] * scale),
                "w": int(region["w"] * scale),
                "h": int(region["h"] * scale),
            }
            for region in blocked
        ]
        # Keep layout dimensions in screenshot space for gap fallback.
        layout = {
            **layout,
            "pageWidth": image.width,
            "pageHeight": image.height,
            "headerBottom": int(layout.get("headerBottom", 80) * scale),
            "footerTop": int(layout.get("footerTop", image.height) * scale),
            "blocks": [
                {
                    **b,
                    "x": int(b["x"] * scale),
                    "y": int(b["y"] * scale),
                    "w": int(b["w"] * scale),
                    "h": int(b["h"] * scale),
                }
                for b in (layout.get("blocks") or [])
            ],
            "asides": [
                {
                    **a,
                    "x": int(a["x"] * scale),
                    "y": int(a["y"] * scale),
                    "w": int(a["w"] * scale),
                    "h": int(a["h"] * scale),
                }
                for a in (layout.get("asides") or [])
            ],
            "blocked": blocked,
        }

    saliency = predict_saliency(image)
    safe_mask = build_safe_mask(image.size, blocked)
    recommendations = recommend_slots(saliency, safe_mask, image)

    # Dense pages often paint the protected-DOM mask over everything. Fall back
    # to layout gap heuristics so the UI still gets actionable placements.
    warning_extra = None
    soft_error = None
    if not recommendations:
        layout_hotspots = find_hotspots(layout)
        recommendations = [hot.as_dict() for hot in layout_hotspots]
        if recommendations:
            warning_extra = (
                "Used layout-gap fallback because saliency filters found no clear whitespace slots."
            )
        else:
            soft_error = "Heatmap generated, but no safe standard-size ad slot was found."

    annotated = render_heatmap(image, saliency, recommendations)

    # Keep the full page. Downscale width if needed so payloads stay usable;
    # never crop height — ad slots further down the page must remain visible.
    max_w = 1200
    if annotated.width > max_w:
        ratio = max_w / float(annotated.width)
        annotated = annotated.resize(
            (max_w, max(1, int(annotated.height * ratio))),
            Image.Resampling.LANCZOS,
        )
        for item in recommendations:
            item["x"] = int(item["x"] * ratio)
            item["y"] = int(item["y"] * ratio)
            item["width"] = max(1, int(item["width"] * ratio))
            item["height"] = max(1, int(item["height"] * ratio))

    # Taller pages get slightly stronger JPEG compression to avoid huge data URIs.
    quality = 82 if annotated.height <= 3000 else (72 if annotated.height <= 6000 else 62)
    buf = io.BytesIO()
    annotated.save(buf, format="JPEG", quality=quality, optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")

    warning = None
    if annotated.height <= VIEWPORT["height"] + 40:
        warning = (
            "Page height looks like a single viewport — this host may be serving a "
            "minimal/bot version of the site. Try the exact live URL that shows full content in your browser."
        )
    if warning_extra:
        warning = f"{warning} {warning_extra}".strip() if warning else warning_extra

    return {
        "url": url,
        "final_url": final_url,
        "page_width": annotated.width,
        "page_height": annotated.height,
        "model": "DeepGaze I (pretrained)",
        "hotspot_count": len(recommendations),
        "hotspots": recommendations,
        "image_base64": encoded,
        "warning": warning,
        "error": soft_error,
    }
