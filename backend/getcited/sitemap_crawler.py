from __future__ import annotations

import gzip
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}
REQUEST_TIMEOUT = 20.0
MAX_WORKERS = 8
SITEMAP_CANDIDATES = ("/sitemap.xml", "/sitemap_index.xml", "/sitemap.xml.gz")


def normalize_site_url(raw: str) -> str:
    """Accept https://..., http://..., or a bare host like synapical.com."""
    url = raw.strip()
    if not url:
        raise ValueError("URL is required")

    # Strip accidental path/query if user pasted a full page URL; keep host.
    has_scheme = bool(re.match(r"^https?://", url, re.I))
    if not has_scheme:
        url = "https://" + url

    parsed = urlparse(url)
    host = (parsed.netloc or parsed.path.split("/")[0]).strip().lower()
    host = host.split("@")[-1]  # drop userinfo if present
    if not host or "." not in host and host != "localhost":
        raise ValueError("Invalid URL — try something like synapical.com")

    scheme = parsed.scheme.lower() if has_scheme else "https"
    return f"{scheme}://{host}"


def _host_key(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _origin(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def resolve_site_url(raw: str, client: httpx.Client) -> str:
    """
    Normalize input and pick an origin to crawl.
    Never fails on HTTP 403/4xx — always returns a usable site URL.
    Keeps the user-entered host when a redirect jumps to a CDN (e.g. pages.dev).
    """
    preferred = normalize_site_url(raw)
    host = urlparse(preferred).netloc
    user_gave_scheme = bool(re.match(r"^https?://", raw.strip(), re.I))

    candidates = [preferred]
    if not user_gave_scheme:
        other = f"http://{host}" if preferred.startswith("https://") else f"https://{host}"
        candidates.append(other)

    for candidate in candidates:
        try:
            resp = client.get(candidate)
        except httpx.HTTPError:
            continue

        # Stay on the host the user typed if Cloudflare/CDN redirects elsewhere.
        if _host_key(str(resp.url)) == _host_key(candidate):
            return _origin(str(resp.url))
        return _origin(candidate)

    # DNS/connect failed for every candidate — still crawl with preferred URL.
    return preferred


def _client() -> httpx.Client:
    return httpx.Client(
        headers=REQUEST_HEADERS,
        follow_redirects=True,
        timeout=REQUEST_TIMEOUT,
    )


def _decode_body(response: httpx.Response, url: str) -> str:
    content = response.content
    if url.endswith(".gz") or response.headers.get("content-type", "").endswith("gzip"):
        try:
            content = gzip.decompress(content)
        except OSError:
            pass
    return content.decode(response.encoding or "utf-8", errors="replace")


def _parse_sitemap_locs(xml_text: str) -> tuple[list[str], list[str]]:
    """Return (page_urls, nested_sitemap_urls)."""
    soup = BeautifulSoup(xml_text, "xml")
    page_urls: list[str] = []
    nested: list[str] = []

    if soup.find("sitemapindex"):
        for node in soup.find_all("sitemap"):
            loc = node.find("loc")
            if loc and loc.text.strip():
                nested.append(loc.text.strip())
        return page_urls, nested

    for node in soup.find_all("url"):
        loc = node.find("loc")
        if loc and loc.text.strip():
            page_urls.append(loc.text.strip())

    # Fallback: any <loc> if structure is unusual
    if not page_urls and not nested:
        for loc in soup.find_all("loc"):
            text = loc.text.strip()
            if text:
                page_urls.append(text)
    return page_urls, nested


def discover_sitemap_urls(site_url: str, client: httpx.Client) -> list[str]:
    found: list[str] = []
    site_host = _host_key(site_url)

    robots_url = urljoin(site_url + "/", "robots.txt")
    try:
        resp = client.get(robots_url)
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    sitemap = line.split(":", 1)[1].strip()
                    # Only keep sitemaps on the same domain as the input.
                    if sitemap and _host_key(sitemap) == site_host:
                        found.append(sitemap)
    except httpx.HTTPError:
        pass

    for path in SITEMAP_CANDIDATES:
        found.append(urljoin(site_url + "/", path.lstrip("/")))

    # Preserve order, drop duplicates
    seen: set[str] = set()
    unique: list[str] = []
    for url in found:
        if url not in seen:
            seen.add(url)
            unique.append(url)
    return unique


def _same_domain_links(urls: list[str], site_url: str) -> list[str]:
    site_host = _host_key(site_url)
    seen: set[str] = set()
    filtered: list[str] = []
    for link in urls:
        if _host_key(link) != site_host:
            continue
        if link not in seen:
            seen.add(link)
            filtered.append(link)
    return filtered


def collect_links_from_sitemaps(site_url: str, client: httpx.Client) -> tuple[list[str], list[str], str | None]:
    """
    Returns (page_links, sitemap_urls_used, error_message).
    Only keeps sitemaps and page links on the same domain as site_url.
    """
    candidates = discover_sitemap_urls(site_url, client)
    used: list[str] = []
    page_links: list[str] = []
    queue = list(candidates)
    seen_sitemaps: set[str] = set()
    site_host = _host_key(site_url)

    while queue:
        sitemap_url = queue.pop(0)
        if sitemap_url in seen_sitemaps:
            continue
        seen_sitemaps.add(sitemap_url)
        if _host_key(sitemap_url) != site_host:
            continue

        try:
            resp = client.get(sitemap_url)
            if resp.status_code != 200:
                continue
            xml_text = _decode_body(resp, sitemap_url)
            if "<urlset" not in xml_text and "<sitemapindex" not in xml_text and "<loc" not in xml_text:
                continue
            pages, nested = _parse_sitemap_locs(xml_text)
            used.append(sitemap_url)
            page_links.extend(pages)
            queue.extend(url for url in nested if _host_key(url) == site_host)
        except httpx.HTTPError:
            continue

    unique_pages = _same_domain_links(page_links, site_url)

    if not used:
        return [], [], "No sitemap found for this site."
    if not unique_pages:
        return [], used, "Sitemap found, but it had no links on this domain."
    return unique_pages, used, None


SKIP_EXTENSIONS = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
    ".css", ".js", ".json", ".xml", ".zip", ".gz", ".mp4", ".mp3", ".woff", ".woff2",
)
MAX_HTML_PAGES = 100


def _normalize_page_url(url: str) -> str:
    parsed = urlparse(url)
    # Drop fragment; keep path (normalize trailing slash except root)
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _is_crawlable_same_domain(href: str, site_url: str) -> bool:
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return False
    absolute = urljoin(site_url + "/", href)
    parsed = urlparse(absolute)
    if parsed.scheme not in ("http", "https"):
        return False
    if _host_key(absolute) != _host_key(site_url):
        return False
    path_lower = (parsed.path or "").lower()
    if path_lower.startswith("/cdn-cgi/"):
        return False
    if any(path_lower.endswith(ext) for ext in SKIP_EXTENSIONS):
        return False
    return True


def extract_same_domain_links(html: str, page_url: str, site_url: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []
    seen: set[str] = set()
    for tag in soup.find_all("a", href=True):
        href = tag["href"].strip()
        if not _is_crawlable_same_domain(href, site_url):
            continue
        absolute = _normalize_page_url(urljoin(page_url, href))
        # Re-check after join/normalize against site origin host
        if _host_key(absolute) != _host_key(site_url):
            continue
        if absolute not in seen:
            seen.add(absolute)
            links.append(absolute)
    return links


def collect_links_from_html(site_url: str, client: httpx.Client) -> tuple[list[str], list[dict], str | None]:
    """
    BFS crawl starting at site_url.
    Returns (links, pages_with_content, error).
    Content is collected while discovering so pages are not fetched twice.
    """
    start = _normalize_page_url(site_url)
    queue = [start]
    links: list[str] = []
    pages: list[dict] = []
    seen: set[str] = set()

    while queue and len(links) < MAX_HTML_PAGES:
        current = queue.pop(0)
        if current in seen:
            continue
        seen.add(current)

        try:
            resp = client.get(current)
        except httpx.HTTPError as exc:
            links.append(current)
            pages.append({"url": current, "ok": False, "status": None, "content": "", "error": str(exc)})
            continue

        if resp.status_code != 200:
            links.append(current)
            pages.append(
                {
                    "url": current,
                    "ok": False,
                    "status": resp.status_code,
                    "content": "",
                    "error": f"HTTP {resp.status_code}",
                }
            )
            continue

        content_type = resp.headers.get("content-type", "")
        if "html" not in content_type and "text" not in content_type and content_type:
            continue

        html = resp.text
        page_url = str(resp.url)
        links.append(current)
        pages.append(
            {
                "url": current,
                "ok": True,
                "status": resp.status_code,
                "content": extract_page_content(html),
                "error": None,
            }
        )

        for link in extract_same_domain_links(html, page_url, site_url):
            if link not in seen:
                queue.append(link)

    if not pages:
        return [], [], "No sitemap found, and no same-domain pages could be crawled from the given URL."
    return links, pages, None


def extract_page_content(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def fetch_page_content(url: str, client: httpx.Client) -> dict:
    try:
        resp = client.get(url)
        if resp.status_code != 200:
            return {"url": url, "ok": False, "status": resp.status_code, "content": "", "error": f"HTTP {resp.status_code}"}
        content_type = resp.headers.get("content-type", "")
        if "html" not in content_type and "text" not in content_type and content_type:
            return {"url": url, "ok": False, "status": resp.status_code, "content": "", "error": f"Skipped non-HTML ({content_type})"}
        content = extract_page_content(resp.text)
        return {"url": url, "ok": True, "status": resp.status_code, "content": content, "error": None}
    except httpx.HTTPError as exc:
        return {"url": url, "ok": False, "status": None, "content": "", "error": str(exc)}


def _fetch_all_pages(links: list[str]) -> list[dict]:
    pages: list[dict] = []

    def worker(url: str) -> dict:
        with _client() as page_client:
            return fetch_page_content(url, page_client)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(worker, link): link for link in links}
        for future in as_completed(futures):
            pages.append(future.result())

    pages.sort(key=lambda item: links.index(item["url"]) if item["url"] in links else 0)
    return pages


def crawl_site(raw_url: str) -> dict:
    with _client() as client:
        site_url = resolve_site_url(raw_url, client)
        links, sitemaps_used, sitemap_error = collect_links_from_sitemaps(site_url, client)
        source = "sitemap"
        pages: list[dict] = []

        if sitemap_error:
            links, pages, html_error = collect_links_from_html(site_url, client)
            source = "html"
            if html_error:
                return {
                    "site_url": site_url,
                    "sitemap_found": False,
                    "source": source,
                    "sitemaps": sitemaps_used,
                    "link_count": 0,
                    "pages": [],
                    "error": html_error,
                }
        else:
            pages = _fetch_all_pages(links)

        return {
            "site_url": site_url,
            "sitemap_found": source == "sitemap",
            "source": source,
            "sitemaps": sitemaps_used,
            "link_count": len(links),
            "pages": pages,
            "error": None,
        }
