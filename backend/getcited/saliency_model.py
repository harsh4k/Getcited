from __future__ import annotations

from functools import lru_cache

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MODEL_MAX_DIM = 768
TILE_HEIGHT = 900
TILE_OVERLAP = 160
MAX_RECOMMENDATIONS = 4

AD_SLOTS = (
    # width, height, label, relative monetization prior
    (970, 250, "Billboard", 1.15),
    (970, 90, "Large leaderboard", 1.10),
    (728, 90, "Leaderboard", 1.00),
    (300, 600, "Half page", 1.12),
    (336, 280, "Large rectangle", 1.05),
    (300, 250, "Medium rectangle", 1.00),
    (160, 600, "Wide skyscraper", 0.84),
)


@lru_cache(maxsize=1)
def _load_model():
    """Load the official pretrained DeepGaze I model once per process."""
    import deepgaze_pytorch

    model = deepgaze_pytorch.DeepGazeI(pretrained=True)
    model.eval()
    return model


def _center_bias(height: int, width: int) -> np.ndarray:
    """Gaussian log-density prior, matching the center-bias input DeepGaze expects."""
    yy, xx = np.mgrid[0:height, 0:width]
    x = (xx - (width - 1) / 2) / max(width * 0.28, 1)
    y = (yy - (height - 1) / 2) / max(height * 0.28, 1)
    log_density = -0.5 * (x * x + y * y)
    maximum = float(log_density.max())
    log_total = maximum + np.log(np.exp(log_density - maximum).sum())
    return (log_density - log_total).astype(np.float32)


def _predict_tile(tile: Image.Image) -> np.ndarray:
    original_width, original_height = tile.size
    scale = min(1.0, MODEL_MAX_DIM / max(original_width, original_height))
    model_width = max(64, int(round(original_width * scale)))
    model_height = max(64, int(round(original_height * scale)))
    resized = tile.convert("RGB").resize((model_width, model_height), Image.Resampling.LANCZOS)

    image = np.asarray(resized, dtype=np.float32)
    image_tensor = torch.from_numpy(image.transpose(2, 0, 1)[None])
    center_tensor = torch.from_numpy(_center_bias(model_height, model_width)[None])

    with torch.inference_mode():
        log_density = _load_model()(image_tensor, center_tensor)
        if log_density.ndim == 3:
            log_density = log_density[:, None]
        density = torch.exp(log_density)
        density = F.interpolate(
            density,
            size=(original_height, original_width),
            mode="bilinear",
            align_corners=False,
        )
    result = density[0, 0].cpu().numpy()
    result -= result.min()
    peak = float(result.max())
    return result / peak if peak > 0 else result


def predict_saliency(image: Image.Image) -> np.ndarray:
    """
    Run DeepGaze over overlapping viewport-height tiles, then blend predictions
    into one full-page pixel-wise attention map.
    """
    width, height = image.size
    if height <= TILE_HEIGHT:
        return _predict_tile(image)

    stride = TILE_HEIGHT - TILE_OVERLAP
    starts = list(range(0, max(height - TILE_HEIGHT, 0) + 1, stride))
    final_start = max(0, height - TILE_HEIGHT)
    if not starts or starts[-1] != final_start:
        starts.append(final_start)

    accumulated = np.zeros((height, width), dtype=np.float32)
    weights = np.zeros((height, width), dtype=np.float32)

    for start in starts:
        end = min(height, start + TILE_HEIGHT)
        tile = image.crop((0, start, width, end))
        prediction = _predict_tile(tile)
        tile_height = end - start

        # Feather overlapping tile edges to avoid horizontal seams.
        feather = np.ones(tile_height, dtype=np.float32)
        overlap = min(TILE_OVERLAP, tile_height // 3)
        if start > 0:
            feather[:overlap] = np.linspace(0.05, 1.0, overlap)
        if end < height:
            feather[-overlap:] = np.linspace(1.0, 0.05, overlap)
        feather = feather[:, None]

        accumulated[start:end] += prediction * feather
        weights[start:end] += feather

    saliency = accumulated / np.maximum(weights, 1e-6)
    low, high = np.percentile(saliency, (5, 99.5))
    saliency = np.clip((saliency - low) / max(high - low, 1e-6), 0, 1)
    return saliency.astype(np.float32)


def build_safe_mask(size: tuple[int, int], blocked: list[dict]) -> np.ndarray:
    """Exclude navigation, controls, headings, media, and other protected DOM regions."""
    width, height = size
    mask_image = Image.new("L", size, 255)
    draw = ImageDraw.Draw(mask_image)
    for region in blocked:
        x = int(region.get("x", 0))
        y = int(region.get("y", 0))
        w = int(region.get("w", 0))
        h = int(region.get("h", 0))
        if w <= 0 or h <= 0:
            continue
        padding = 18
        draw.rectangle(
            (
                max(0, x - padding),
                max(0, y - padding),
                min(width, x + w + padding),
                min(height, y + h + padding),
            ),
            fill=0,
        )
    return np.asarray(mask_image, dtype=np.float32) / 255.0


def _integral(values: np.ndarray) -> np.ndarray:
    return np.pad(values.cumsum(axis=0).cumsum(axis=1), ((1, 0), (1, 0)))


def _area_sum(integral: np.ndarray, x: int, y: int, w: int, h: int) -> float:
    x2, y2 = x + w, y + h
    return float(integral[y2, x2] - integral[y, x2] - integral[y2, x] + integral[y, x])


def _overlap(a: dict, b: dict, padding: int = 160) -> bool:
    return not (
        a["x"] + a["width"] + padding <= b["x"]
        or b["x"] + b["width"] + padding <= a["x"]
        or a["y"] + a["height"] + padding <= b["y"]
        or b["y"] + b["height"] + padding <= a["y"]
    )


def _visual_complexity(image: Image.Image) -> np.ndarray:
    """
    Approximate how visually busy each pixel is. Blank space is safer for an
    inserted ad than text, borders, or detailed imagery.
    """
    grayscale = image.convert("L")
    edges = grayscale.filter(ImageFilter.FIND_EDGES)
    values = np.asarray(edges, dtype=np.float32) / 255.0
    # Slight blur turns individual glyph edges into a local density estimate.
    density = Image.fromarray(np.uint8(values * 255)).filter(
        ImageFilter.GaussianBlur(radius=5)
    )
    return np.asarray(density, dtype=np.float32) / 255.0


def _ring_mean(
    integral: np.ndarray,
    x: int,
    y: int,
    width: int,
    height: int,
    page_width: int,
    page_height: int,
    padding: int = 90,
) -> float:
    outer_x = max(0, x - padding)
    outer_y = max(0, y - padding)
    outer_x2 = min(page_width, x + width + padding)
    outer_y2 = min(page_height, y + height + padding)
    outer_area = (outer_x2 - outer_x) * (outer_y2 - outer_y)
    inner_area = width * height
    ring_area = max(1, outer_area - inner_area)
    outer_sum = _area_sum(
        integral,
        outer_x,
        outer_y,
        outer_x2 - outer_x,
        outer_y2 - outer_y,
    )
    inner_sum = _area_sum(integral, x, y, width, height)
    return max(0.0, (outer_sum - inner_sum) / ring_area)


def _viewability_prior(y: int, height: int) -> tuple[float, str]:
    center = y + height / 2
    if center <= 900:
        return 1.0, "above the fold"
    if center <= 1800:
        return 0.86, "early scroll"
    # Deeper placements are less likely to receive an impression.
    return max(0.46, 0.86 * np.exp(-(center - 1800) / 6000)), "deep scroll"


def recommend_slots(
    saliency: np.ndarray, safe_mask: np.ndarray, image: Image.Image
) -> list[dict]:
    """
    Rank standard ad rectangles with a revenue-oriented proxy:

    - predicted attention around the placement (not only underneath it)
    - expected viewability based on page depth
    - whitespace / low visual complexity inside the slot
    - common format monetization prior
    - strict protected-DOM exclusion
    """
    height, width = saliency.shape
    saliency_integral = _integral(saliency * safe_mask)
    safe_integral = _integral(safe_mask)
    complexity_integral = _integral(_visual_complexity(image))
    candidates: list[dict] = []

    for slot_width, slot_height, label, format_prior in AD_SLOTS:
        if slot_width > width - 32 or slot_height > height - 32:
            continue
        step_x = max(32, min(96, slot_width // 4))
        step_y = max(32, min(96, slot_height // 3))
        for y in range(16, height - slot_height - 15, step_y):
            for x in range(16, width - slot_width - 15, step_x):
                area = slot_width * slot_height
                safe_ratio = _area_sum(safe_integral, x, y, slot_width, slot_height) / area
                if safe_ratio < 0.92:
                    continue

                inside_attention = _area_sum(
                    saliency_integral, x, y, slot_width, slot_height
                ) / area
                nearby_attention = _ring_mean(
                    saliency_integral,
                    x,
                    y,
                    slot_width,
                    slot_height,
                    width,
                    height,
                )
                complexity = _area_sum(
                    complexity_integral, x, y, slot_width, slot_height
                ) / area
                whitespace = float(np.clip(1.0 - complexity * 3.0, 0.0, 1.0))
                if whitespace < 0.42:
                    continue

                viewability, depth_label = _viewability_prior(y, slot_height)
                # Nearby attention is more valuable than covering the current
                # attention peak. A small inside term handles naturally empty
                # but visually central regions.
                attention_context = 0.78 * nearby_attention + 0.22 * inside_attention
                if attention_context < 0.008:
                    continue
                score = (
                    (0.10 + 2.5 * attention_context)
                    * (0.55 + 0.45 * whitespace)
                    * viewability
                    * format_prior
                    * safe_ratio
                )
                candidates.append(
                    {
                        "x": x,
                        "y": y,
                        "width": slot_width,
                        "height": slot_height,
                        "label": label,
                        "score": score,
                        "reason": (
                            f"{depth_label}; attention nearby; "
                            "high whitespace; protected content excluded"
                        ),
                        "metrics": {
                            "nearby_attention": round(float(nearby_attention), 3),
                            "inside_attention": round(float(inside_attention), 3),
                            "whitespace": round(whitespace, 3),
                            "viewability_prior": round(float(viewability), 3),
                            "format_prior": format_prior,
                            "safe_ratio": round(float(safe_ratio), 3),
                        },
                    }
                )

    candidates.sort(key=lambda item: item["score"], reverse=True)
    selected: list[dict] = []
    best_score = candidates[0]["score"] if candidates else 0.0
    for candidate in candidates:
        if best_score and candidate["score"] < best_score * 0.55:
            break
        if any(_overlap(candidate, existing) for existing in selected):
            continue
        selected.append(candidate)
        if len(selected) >= MAX_RECOMMENDATIONS:
            break

    if selected:
        maximum = max(item["score"] for item in selected)
        for rank, item in enumerate(selected, 1):
            item["score"] = round(item["score"] / max(maximum, 1e-8), 3)
            item["label"] = f"#{rank} {item['label']}"
    return selected


def _turbo_colors(values: np.ndarray) -> np.ndarray:
    """Fast blue→cyan→green→yellow→red heatmap without matplotlib."""
    anchors = np.array(
        [
            [48, 18, 59],
            [50, 90, 205],
            [35, 185, 220],
            [70, 220, 110],
            [235, 220, 55],
            [245, 120, 25],
            [180, 4, 38],
        ],
        dtype=np.float32,
    )
    position = values * (len(anchors) - 1)
    lower = np.floor(position).astype(np.int32)
    upper = np.minimum(lower + 1, len(anchors) - 1)
    fraction = (position - lower)[..., None]
    return anchors[lower] * (1 - fraction) + anchors[upper] * fraction


def render_heatmap(
    image: Image.Image, saliency: np.ndarray, recommendations: list[dict]
) -> Image.Image:
    base = np.asarray(image.convert("RGB"), dtype=np.float32)
    heat = _turbo_colors(saliency)
    # Keep low-attention pixels nearly transparent and hot pixels vivid.
    alpha = (np.clip((saliency - 0.08) / 0.92, 0, 1) ** 0.7 * 0.62)[..., None]
    blended = base * (1 - alpha) + heat * alpha
    result = Image.fromarray(np.uint8(np.clip(blended, 0, 255))).filter(
        ImageFilter.GaussianBlur(radius=0.35)
    )

    draw = ImageDraw.Draw(result, "RGBA")
    font = ImageFont.load_default()
    for candidate in (
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ):
        try:
            font = ImageFont.truetype(candidate, 18)
            break
        except OSError:
            continue

    for item in recommendations:
        box = (
            item["x"],
            item["y"],
            item["x"] + item["width"],
            item["y"] + item["height"],
        )
        draw.rectangle(box, outline=(255, 255, 255, 245), width=4)
        caption = f"{item['label']} · {item['score']:.2f}"
        bounds = draw.textbbox((item["x"], max(4, item["y"] - 27)), caption, font=font)
        draw.rectangle(
            (bounds[0] - 5, bounds[1] - 4, bounds[2] + 5, bounds[3] + 4),
            fill=(15, 23, 42, 225),
        )
        draw.text(
            (item["x"], max(4, item["y"] - 27)),
            caption,
            fill=(255, 255, 255, 255),
            font=font,
        )
    return result
