#!/usr/bin/env python3
"""
Mary Shubic - pre-launch site audit (single file, Python 3.8+, standard library only)

What it checks (read-only, nothing is changed anywhere):
  1  Infrastructure: redirects, TLS expiry, security headers, compression, speed
  2  SEO basics: title/meta/OG, robots.txt, sitemap, favicon, 404 page
  3  Legal & trust pages: exist? real content? placeholders left in?
  4  Pricing & delivery transparency (drip-pricing, was/now prices)
  5  Product pages: structured data (JSON-LD), alt text, condition, size guide
  6  Listing pages: filters noindex, canonicals
  7  Site search
  8  Cookies & trackers (consent gate)
  9  Images & performance
  10 Accessibility (static checks + brand colour contrast)
  11 Backend/API exposure (health, CORS, open ports)
  12 Email DNS (SPF / DKIM / DMARC)
  13 Source code (--repo): payment element type, Stripe mode, emails, search, consent...
  14 VM (--vm): backups, off-site copy, memory/swap, restart policies

Usage (Mac Terminal):
  python3 site_audit.py
  python3 site_audit.py --repo "~/eCommerce/Web Development/mary-shubic-medusa-store" --vm oracle-store

Output: coloured terminal report + audit-report-<timestamp>.md and .json in the current folder.
Upload the .md file back to Claude chat to continue.
"""
import argparse, gzip, json, os, random, re, socket, ssl, subprocess, sys, time, zlib
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, HTTPSHandler, HTTPHandler, Request, build_opener

UA = "MaryShubicAudit/1.0 (+self-audit)"
COL = {"PASS": "\033[32m", "WARN": "\033[33m", "FAIL": "\033[31m", "INFO": "\033[36m"}
RST, BOLD = "\033[0m", "\033[1m"

try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl.create_default_context()


# ----------------------------------------------------------------------------- reporting
class Report:
    def __init__(self):
        self.rows, self.section = [], ""

    def sec(self, name):
        self.section = name
        print(f"\n{BOLD}== {name} =={RST}")

    def add(self, status, name, detail=""):
        self.rows.append({"section": self.section, "status": status, "check": name, "detail": detail})
        print(f"  {COL[status]}{status:<4}{RST} {name}" + (f"  - {detail}" if detail else ""))


R = Report()
ok = lambda n, d="": R.add("PASS", n, d)
warn = lambda n, d="": R.add("WARN", n, d)
fail = lambda n, d="": R.add("FAIL", n, d)
info = lambda n, d="": R.add("INFO", n, d)


# ----------------------------------------------------------------------------- http
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def http(url, method="GET", follow=True, headers=None, timeout=20, max_bytes=2_500_000):
    h = {"User-Agent": UA, "Accept-Encoding": "gzip", "Accept": "text/html,application/xml,*/*"}
    h.update(headers or {})
    handlers = [HTTPHandler(), HTTPSHandler(context=CTX)] + ([] if follow else [NoRedirect()])
    opener = build_opener(*handlers)
    t0 = time.time()
    try:
        resp = opener.open(Request(url, headers=h, method=method), timeout=timeout)
    except HTTPError as e:
        resp = e
    except Exception as e:
        return {"status": 0, "error": f"{type(e).__name__}: {e}", "headers": {}, "cookies": [],
                "body": "", "url": url, "ttfb": 0, "bytes": 0}
    ttfb = time.time() - t0
    raw = b""
    if method != "HEAD":
        try:
            raw = resp.read(max_bytes)
        except Exception:
            pass
    enc = (resp.headers.get("Content-Encoding") or "").lower()
    if enc == "gzip" and raw:
        try:
            raw = zlib.decompressobj(16 + zlib.MAX_WBITS).decompress(raw)
        except Exception:
            pass
    return {
        "status": resp.getcode(),
        "headers": {k.lower(): v for k, v in resp.headers.items()},
        "cookies": resp.headers.get_all("Set-Cookie") or [],
        "body": raw.decode("utf-8", "replace"),
        "url": getattr(resp, "url", url) or url,
        "ttfb": ttfb,
        "bytes": len(raw),
        "encoding": enc,
    }


# ----------------------------------------------------------------------------- html parsing
class Page(HTMLParser):
    VOID = {"img", "input", "meta", "link", "br", "hr"}

    def __init__(self, html, url):
        super().__init__(convert_charrefs=True)
        self.url, self.html = url, html
        self.title, self.meta, self.canonical = "", {}, None
        self.lang, self.imgs, self.anchors, self.scripts, self.ld = None, [], [], [], []
        self.inputs, self.buttons, self.headings, self.label_for = [], [], [], set()
        self.text_parts, self.forms, self.links = [], 0, []
        self._skip, self._cur = 0, []  # stack of open capture targets
        self._label_depth = 0
        try:
            self.feed(html)
        except Exception:
            pass
        self.text = re.sub(r"\s+", " ", " ".join(self.text_parts))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._cur.append(("title", {"t": ""}))
        elif tag == "meta":
            k = a.get("name") or a.get("property") or a.get("http-equiv")
            if k:
                self.meta[k.lower()] = a.get("content", "")
        elif tag == "link":
            self.links.append(a)
            if "canonical" in (a.get("rel") or ""):
                self.canonical = a.get("href")
        elif tag == "img":
            self.imgs.append({"src": a.get("src") or "", "alt": a.get("alt"), "loading": a.get("loading"),
                              "w": a.get("width"), "h": a.get("height"), "srcset": a.get("srcset")})
        elif tag == "a":
            self._cur.append(("a", {"href": a.get("href") or "", "label": a.get("aria-label") or "", "t": ""}))
        elif tag == "button":
            self._cur.append(("button", {"label": a.get("aria-label") or "", "t": "", "type": a.get("type")}))
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._cur.append(("h", {"lvl": int(tag[1]), "t": ""}))
        elif tag == "script":
            self._skip += 1
            self._cur.append(("script", {"src": a.get("src"), "type": a.get("type") or "", "t": ""}))
        elif tag == "style":
            self._skip += 1
        elif tag == "form":
            self.forms += 1
        elif tag == "label":
            self._label_depth += 1
            if a.get("for"):
                self.label_for.add(a["for"])
        elif tag in ("input", "textarea", "select"):
            d = dict(a)
            d["_tag"], d["_in_label"] = tag, self._label_depth > 0
            self.inputs.append(d)

    def handle_endtag(self, tag):
        if tag == "style":
            self._skip = max(0, self._skip - 1)
        elif tag == "label":
            self._label_depth = max(0, self._label_depth - 1)
        kinds = {"title": "title", "a": "a", "button": "button", "script": "script",
                 "h1": "h", "h2": "h", "h3": "h", "h4": "h", "h5": "h", "h6": "h"}
        kind = kinds.get(tag)
        if kind and self._cur:
            for i in range(len(self._cur) - 1, -1, -1):
                if self._cur[i][0] == kind:
                    k, d = self._cur.pop(i)
                    d["t"] = re.sub(r"\s+", " ", d.get("t", "")).strip()
                    if k == "title":
                        self.title = d["t"]
                    elif k == "a":
                        self.anchors.append(d)
                    elif k == "button":
                        self.buttons.append(d)
                    elif k == "h":
                        self.headings.append(d)
                    elif k == "script":
                        self._skip = max(0, self._skip - 1)
                        self.scripts.append(d)
                        if "ld+json" in d["type"]:
                            try:
                                self.ld.append(json.loads(d["t"]))
                            except Exception:
                                self.ld.append({"_invalid": True})
                    break

    def handle_data(self, data):
        for k, d in self._cur:
            if k in ("title", "a", "button", "h", "script"):
                d["t"] = d.get("t", "") + data
        if not self._skip and data.strip():
            self.text_parts.append(data.strip())

    # helpers
    def ld_types(self):
        out = []

        def walk(o):
            if isinstance(o, dict):
                t = o.get("@type")
                if t:
                    out.extend(t if isinstance(t, list) else [t])
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(self.ld)
        return out

    def ld_find(self, typ):
        found = []

        def walk(o):
            if isinstance(o, dict):
                t = o.get("@type")
                if t == typ or (isinstance(t, list) and typ in t):
                    found.append(o)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(self.ld)
        return found

    def robots(self):
        return (self.meta.get("robots") or "").lower()


def get_page(url):
    r = http(url)
    return r, Page(r["body"], r["url"]) if r["status"] else None


# ----------------------------------------------------------------------------- contrast
def _lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def blend(fg, bg, alpha):
    f = [int(fg[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(bg[i:i + 2], 16) for i in (0, 2, 4)]
    return "".join(f"{round(f[i] * alpha + b[i] * (1 - alpha)):02X}" for i in range(3))


# ----------------------------------------------------------------------------- config / shared state
A = None  # parsed args
G = {"home": None, "pdps": [], "plp": None, "sitemap": [], "legal": {}, "img_urls": []}


def host_of(u):
    return urlparse(u).netloc


def is_https(u):
    return urlparse(u).scheme == "https"


def internal_links(page, base):
    base_host = host_of(base).replace("www.", "")
    out = []
    for a in page.anchors:
        h = (a["href"] or "").strip()
        if not h or h.startswith(("#", "mailto:", "tel:", "javascript:", "sms:")):
            continue
        full = urljoin(page.url, h).split("#")[0]
        p = urlparse(full)
        if p.netloc.replace("www.", "") != base_host or p.path.startswith("/_next"):
            continue
        if re.search(r"\.(png|jpe?g|webp|svg|ico|css|js|pdf|xml|txt)$", p.path, re.I):
            continue
        out.append(full)
    return list(dict.fromkeys(out))


# ----------------------------------------------------------------------------- 1 infrastructure
def tls_days(host):
    try:
        with socket.create_connection((host, 443), timeout=8) as s:
            with CTX.wrap_socket(s, server_hostname=host) as ss:
                exp = ss.getpeercert()["notAfter"]
        end = datetime.strptime(exp, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        return (end - datetime.now(timezone.utc)).days, None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def s_infra():
    R.sec("1. Infrastructure, TLS and headers")
    host = host_of(A.base)
    apex = host.replace("www.", "")
    if is_https(A.base):
        for u in (f"http://{host}/", f"http://{apex}/", f"https://{apex}/"):
            r = http(u, follow=False, timeout=12)
            loc = r["headers"].get("location", "")
            if r["status"] in (301, 308) and (loc.startswith("https://")):
                ok(f"Redirect {u}", f"{r['status']} -> {loc}")
            elif r["status"] in (302, 307) and loc.startswith("https://"):
                warn(f"Redirect {u}", f"temporary {r['status']} -> {loc}; use 301/308 for SEO")
            elif u.startswith("https://") and r["status"] == 200:
                warn(f"{u} serves content directly", "apex and www both live; confirm canonical tags point to one")
            else:
                fail(f"Redirect {u}", f"status {r['status']} {r.get('error','')}")
        for h in dict.fromkeys([host, host_of(A.api), host_of(A.media)]):
            d, err = tls_days(h)
            if d is None:
                warn(f"TLS {h}", err + " (if every check fails: Mac Python needs 'Install Certificates.command' or pip3 install certifi)")
            elif d < 14:
                fail(f"TLS {h}", f"expires in {d} days")
            elif d < 30:
                warn(f"TLS {h}", f"expires in {d} days (Caddy should auto-renew; confirm)")
            else:
                ok(f"TLS {h}", f"{d} days left")
    else:
        info("Base URL is http - TLS checks skipped")

    r = http(A.base + "/")
    if not r["status"]:
        fail("Homepage unreachable", r.get("error", ""))
        return
    hd = r["headers"]
    checks = [
        ("strict-transport-security", "HSTS", warn),
        ("x-content-type-options", "X-Content-Type-Options", warn),
        ("referrer-policy", "Referrer-Policy", warn),
    ]
    for k, label, fn in checks:
        (ok if k in hd else fn)(f"Header {label}", hd.get(k, "missing - add in Caddyfile `header` block"))
    if "x-frame-options" in hd or "frame-ancestors" in hd.get("content-security-policy", ""):
        ok("Clickjacking protection", "present")
    else:
        warn("Clickjacking protection", "no X-Frame-Options / frame-ancestors")
    info("Content-Security-Policy", hd.get("content-security-policy", "none set (optional; add after analytics/Stripe are final)")[:100])
    if "x-powered-by" in hd:
        info("X-Powered-By exposed", hd["x-powered-by"] + " (set poweredByHeader:false in next.config)")
    if r["encoding"] in ("gzip", "br", "zstd"):
        ok("Compression", r["encoding"])
    else:
        warn("Compression", "HTML came back uncompressed; add `encode gzip zstd` in Caddy or enable Next compress")
    times = [http(A.base + f"/{A.country}")["ttfb"] for _ in range(3)]
    med = sorted(times)[1]
    (ok if med < 0.8 else warn if med < 1.5 else fail)("Server response (median of 3)", f"{med*1000:.0f} ms to first byte")
    info("Cache-Control on HTML", hd.get("cache-control", "none"))


# ----------------------------------------------------------------------------- 2 SEO
def s_seo():
    R.sec("2. SEO basics and core pages")
    r, p = get_page(f"{A.base}/{A.country}")
    if not p:
        fail(f"/{A.country} homepage", r.get("error", "unreachable"))
        return
    G["home"] = p
    (ok if r["status"] == 200 else fail)(f"/{A.country} status", str(r["status"]))
    t = p.title
    (ok if 20 <= len(t) <= 65 else warn)("Title tag", f"{len(t)} chars: {t[:70]}")
    d = p.meta.get("description", "")
    (ok if 70 <= len(d) <= 170 else warn if d else fail)("Meta description", f"{len(d)} chars" if d else "missing")
    (ok if p.canonical else fail)("Canonical", p.canonical or "missing")
    for k in ("og:title", "og:description", "og:image", "twitter:card"):
        (ok if p.meta.get(k) else warn)(f"Meta {k}", (p.meta.get(k) or "missing")[:70])
    h1 = [h for h in p.headings if h["lvl"] == 1]
    (ok if len(h1) == 1 else warn)("Exactly one <h1>", f"found {len(h1)}")
    (ok if p.lang else fail)("<html lang>", p.lang or "missing")
    (ok if "viewport" in p.meta else fail)("Viewport meta", p.meta.get("viewport", "missing"))
    if "noindex" in p.robots():
        fail("Homepage is noindex!", p.robots())
    types = p.ld_types()
    (ok if "Organization" in types or "WebSite" in types else warn)("Homepage JSON-LD (Organization/WebSite)", ", ".join(types) or "none")

    rb = http(A.base + "/robots.txt")
    if rb["status"] == 200 and "user-agent" in rb["body"].lower():
        ok("robots.txt", "200")
        (ok if "sitemap:" in rb["body"].lower() else warn)("robots.txt lists Sitemap", "")
        dis = [x for x in ("cart", "checkout", "account") if x in rb["body"].lower()]
        (ok if dis else warn)("robots.txt blocks cart/checkout/account", ", ".join(dis) or "none listed (noindex tags may cover it)")
    else:
        fail("robots.txt", f"status {rb['status']}")

    sm = http(A.base + "/sitemap.xml")
    if sm["status"] == 200 and "<loc>" in sm["body"]:
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", sm["body"])
        if "<sitemapindex" in sm["body"]:
            kids = locs[:5]
            locs = []
            for k in kids:
                locs += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", http(k)["body"])
        G["sitemap"] = locs
        prod = [u for u in locs if "/products/" in u]
        ok("sitemap.xml", f"{len(locs)} URLs ({len(prod)} products)")
        bad = [u for u in locs if re.search(r"/(cart|checkout|account|order)", u) or "?" in u]
        (ok if not bad else warn)("Sitemap excludes cart/account/filter URLs", f"{len(bad)} questionable" if bad else "clean")
        if len(prod) < 5:
            warn("Sitemap product count low", "expected near your catalogue size once products are published")
        wrong = [u for u in locs if host_of(u).replace("www.", "") != host_of(A.base).replace("www.", "")]
        (ok if not wrong else fail)("Sitemap URLs use your domain", f"{len(wrong)} point elsewhere (e.g. localhost?)" if wrong else "yes")
        sample = random.sample(locs, min(5, len(locs)))
        bad_s = [u for u in sample if http(u)["status"] != 200]
        (ok if not bad_s else fail)("Sitemap sample URLs return 200", f"{len(sample)-len(bad_s)}/{len(sample)}")
    else:
        fail("sitemap.xml", f"status {sm['status']}")

    for path, label in (("/favicon.ico", "favicon.ico"),):
        x = http(A.base + path)
        (ok if x["status"] == 200 else fail)(label, str(x["status"]))
    og = p.meta.get("og:image")
    if og:
        x = http(urljoin(p.url, og), method="HEAD")
        (ok if x["status"] == 200 else fail)("og:image URL loads", f"{x['status']} {x['headers'].get('content-type','')}")
        if "localhost" in og or "127.0.0.1" in og:
            fail("og:image points to localhost", og)
    nf = http(f"{A.base}/{A.country}/this-page-should-not-exist-{random.randint(1000,9999)}")
    if nf["status"] == 404:
        ok("Unknown URL returns real 404", "")
        if re.search(r"could not be found", nf["body"], re.I) and "shubic" not in nf["body"].lower():
            warn("404 page looks like the default Next.js one", "build a branded 404 with search + category links")
    else:
        fail("Unknown URL returns real 404", f"got {nf['status']} (soft-404 hurts SEO)")


# ----------------------------------------------------------------------------- discovery + broken links
def s_discover():
    R.sec("3. Page discovery and broken links")
    home = G["home"]
    if not home:
        return
    links = internal_links(home, A.base)
    prods = [u for u in G["sitemap"] if "/products/" in u] or [u for u in links if "/products/" in u]
    cats = [u for u in G["sitemap"] if re.search(r"/(categories|collections)/", u)] or [u for u in links if re.search(r"/(categories|collections|store)", u)]
    info("Discovered", f"{len(prods)} product URLs, {len(cats)} category/collection URLs")
    if prods:
        pick = [prods[0], prods[len(prods) // 2], prods[-1]]
        for u in dict.fromkeys(pick):
            r, p = get_page(u)
            if p:
                G["pdps"].append((u, r, p))
    else:
        fail("No product URLs found", "publish products / check sitemap")
    if cats:
        r, p = get_page(cats[0])
        if p:
            G["plp"] = (cats[0], r, p)
    elif not cats:
        warn("No category URLs found", "")
    pool = list(links)
    for _, _, p in G["pdps"]:
        pool += internal_links(p, A.base)
    if G["plp"]:
        pool += internal_links(G["plp"][2], A.base)
    pool = list(dict.fromkeys(pool))[:80]

    def chk(u):
        r = http(u, timeout=15)
        return u, r["status"]
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(chk, pool))
    bad = [(u, s) for u, s in res if s >= 400 or s == 0]
    (ok if not bad else fail)(f"Internal links checked ({len(pool)})", "no broken links" if not bad else f"{len(bad)} broken")
    for u, s in bad[:15]:
        info("  broken", f"{s} {u}")


# ----------------------------------------------------------------------------- legal
LEGAL = {
    "returns": (r"return|refund", ["returns", "return-policy", "returns-policy", "refunds", "returns-refunds", "content/returns", "pages/returns"], True),
    "terms": (r"terms", ["terms", "terms-and-conditions", "terms-conditions", "terms-of-service", "terms-of-sale", "content/terms"], True),
    "privacy": (r"privacy", ["privacy", "privacy-policy", "content/privacy-policy", "privacy-notice"], True),
    "shipping": (r"deliver|shipping|postage", ["shipping", "delivery", "shipping-policy", "delivery-information", "shipping-and-delivery", "shipping-returns"], True),
    "cookies": (r"cookie", ["cookies", "cookie-policy", "cookie-settings"], True),
    "contact": (r"contact", ["contact", "contact-us", "help"], True),
    "about": (r"about|our story", ["about", "about-us", "our-story"], False),
    "faq": (r"faq|help", ["faq", "faqs", "help"], False),
    "size guide": (r"size", ["size-guide", "sizing", "size-chart"], False),
}
PLACEHOLDER = re.compile(r"lorem ipsum|\[(company|your|insert|address|email|date|name|phone)[^\]]{0,30}\]|\bTODO\b|\bTBC\b|XXXX|your company|example\.com|coming soon", re.I)


def s_legal():
    R.sec("4. Legal and trust pages")
    home = G["home"]
    if not home:
        return
    all_links = internal_links(home, A.base)
    texts = {}
    for a in home.anchors:
        texts[urljoin(home.url, a["href"]).split("#")[0]] = a["t"] or a["label"]
    for name, (rx, paths, must) in LEGAL.items():
        found = None
        for u, t in texts.items():
            if re.search(rx, t or "", re.I) and host_of(u).replace("www.", "") == host_of(A.base).replace("www.", ""):
                r, p = get_page(u)
                if r["status"] == 200 and not re.search(r"could not be found|page not found", p.text[:600], re.I):
                    found = (u, r, p)
                    break
        if not found:
            for path in paths:
                for pre in (f"/{A.country}/", "/"):
                    u = f"{A.base}{pre}{path}"
                    r, p = get_page(u)
                    if r["status"] == 200 and p and not re.search(r"could not be found|page not found", p.text[:600], re.I):
                        found = (u, r, p)
                        break
                if found:
                    break
        if not found:
            (fail if must else warn)(f"{name.title()} page", "not found (no footer link, no common URL)")
            continue
        u, r, p = found
        G["legal"][name] = p
        linked = any(u.rstrip("/") == l.rstrip("/") for l in all_links)
        words = len(p.text.split())
        status = ok
        notes = [f"{u.replace(A.base,'')}", f"{words} words", "linked from homepage" if linked else "NOT linked from homepage/footer"]
        if not linked:
            status = warn
        if words < 150 and name in ("returns", "terms", "privacy", "shipping", "cookies"):
            status = warn
            notes.append("very short")
        ph = PLACEHOLDER.search(p.text)
        if ph:
            status = fail
            notes.append(f"placeholder text: '{ph.group(0)}'")
        status(f"{name.title()} page", "; ".join(notes))

    def has(name, rx, label, must=False):
        p = G["legal"].get(name)
        if not p:
            return
        (ok if re.search(rx, p.text, re.I) else (fail if must else warn))(f"{name.title()} page mentions {label}", "")
    has("returns", r"14\s*(calendar\s*)?days|fourteen", "14-day cancellation window", True)
    has("returns", r"cancel", "right to cancel")
    has("returns", r"second.?hand|pre.?owned|condition|worn", "pre-owned/condition handling")
    has("terms", r"consumer rights act|consumer contracts|governing law|england|jurisdiction", "governing law / UK consumer rights")
    has("privacy", r"ICO|information commissioner|data controller|UK GDPR|lawful basis", "ICO / controller / UK GDPR")
    has("shipping", r"£\s?\d|free", "delivery price")
    has("shipping", r"\d+\s*(-|to)?\s*\d*\s*(working|business)?\s*days?", "delivery times")
    allt = home.text + " " + " ".join(p.text for p in G["legal"].values())
    ident = re.search(r"company (number|no)|registered (in|office|address)|companies house|\bLtd\b|\bLimited\b", allt, re.I)
    (ok if ident else fail)("Business identity (company name/number/registered address)", "found" if ident else "not found anywhere - required for UK online traders")
    (ok if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", allt) else warn)("Contact email visible", "")


# ----------------------------------------------------------------------------- pricing
def s_pricing():
    R.sec("5. Pricing and delivery transparency (DMCC drip-pricing)")
    if not G["pdps"]:
        warn("No product pages available to check")
        return
    for u, r, p in G["pdps"]:
        short = urlparse(u).path[-45:]
        t = p.text
        near = re.search(r"(deliver|shipping|postage)[^.]{0,160}(£\s?\d+(\.\d\d)?|free)", t, re.I) or re.search(r"(£\s?\d+(\.\d\d)?|free)[^.]{0,120}(deliver|shipping|postage)", t, re.I)
        (ok if near else warn)(f"Delivery cost stated on PDP ...{short}", near.group(0)[:90] if near else "only generic wording; show actual price/threshold")
        cur = re.search(r"£\s?\d", t)
        (ok if cur else fail)(f"GBP price visible ...{short}", "")
    plp_html = (G["plp"][2].html if G["plp"] else "") + "".join(p.html for _, _, p in G["pdps"])
    if "line-through" in plp_html:
        info("Strike-through (was/now) prices in use", "keep a price-history record: 'was' must be a genuine recent price")
    else:
        info("No strike-through prices on sampled pages", "fine until sales start")
    if G["home"] and not re.search(r"free (uk )?(delivery|shipping)|delivery from|£\d+ delivery", G["home"].text, re.I):
        info("No delivery message on homepage", "optional announcement bar: 'Free UK delivery over £X'")
    info("Checkout total", "manual: add item, go to checkout, confirm delivery + total shown before the payment step (cannot be automated safely)")


# ----------------------------------------------------------------------------- PDP
def s_pdp():
    R.sec("6. Product pages: structured data and content")
    if not G["pdps"]:
        return
    agg = Counter()
    for u, r, p in G["pdps"]:
        short = urlparse(u).path[-40:]
        prods = p.ld_find("Product")
        if not prods:
            agg["noprod"] += 1
            continue
        pr = prods[0]
        offers = pr.get("offers")
        offers = offers[0] if isinstance(offers, list) and offers else offers or {}
        miss = [k for k in ("name", "image", "description", "sku", "brand") if not pr.get(k)]
        omiss = [k for k in ("price", "priceCurrency", "availability") if not (offers or {}).get(k)]
        if not pr.get("itemCondition") and not (offers or {}).get("itemCondition"):
            omiss.append("itemCondition")
        (ok if not (miss or omiss) else warn)(f"Product JSON-LD ...{short}", ("missing: " + ", ".join(miss + omiss)) if (miss or omiss) else "complete")
    if agg["noprod"]:
        fail(f"Product JSON-LD missing on {agg['noprod']}/{len(G['pdps'])} sampled product pages", "needed for rich results (price/stock in Google)")
    for u, r, p in G["pdps"][:1]:
        types = p.ld_types()
        (ok if "BreadcrumbList" in types else warn)("BreadcrumbList JSON-LD", "")
        (ok if p.canonical else fail)("PDP canonical", p.canonical or "missing")
        (ok if p.meta.get("og:image") else warn)("PDP og:image", "")
        (ok if len([h for h in p.headings if h["lvl"] == 1]) == 1 else warn)("PDP single <h1>", "")
        noalt = [i for i in p.imgs if i["alt"] is None]
        (ok if not noalt else fail)("PDP images have alt attribute", f"{len(noalt)} missing" if noalt else "all present")
        (ok if re.search(r"condition", p.text, re.I) else warn)("Condition shown on PDP", "")
        (ok if re.search(r"size guide", p.text + " ".join(a["t"] for a in p.anchors), re.I) else warn)("Size guide link on PDP", "")
        (ok if re.search(r"measure|cm\b|inch|chest|waist|bust", p.text, re.I) else warn)("Measurements on PDP", "important for one-off/pre-owned items")
        (ok if re.search(r"fabric|material|care|wash", p.text, re.I) else warn)("Fabric & care info", "")


# ----------------------------------------------------------------------------- PLP
def s_plp():
    R.sec("7. Listing pages")
    if not G["plp"]:
        warn("No category page to test")
        return
    u, r, p = G["plp"]
    (ok if p.canonical else fail)("Category canonical", p.canonical or "missing")
    if p.canonical and "?" in p.canonical:
        fail("Category canonical contains query string", p.canonical)
    rf, pf = get_page(u + ("&" if "?" in u else "?") + "sortBy=price_asc&colour=Black&size=M")
    if pf:
        (ok if "noindex" in pf.robots() else fail)("Filtered/sorted URLs are noindex", pf.robots() or "no robots meta")
    info("Filter UI present", "yes" if re.search(r"condition", p.text, re.I) and re.search(r"colou?r", p.text, re.I) else "not detected in server HTML (may be client-rendered)")
    lazy = [i for i in p.imgs if i["loading"] == "lazy"]
    (ok if len(lazy) >= max(1, len(p.imgs) // 2) else warn)("Category images lazy-loaded", f"{len(lazy)}/{len(p.imgs)}")
    noalt = [i for i in p.imgs if not i["alt"]]
    (ok if not noalt else warn)("Category images have alt text", f"{len(noalt)} empty/missing of {len(p.imgs)}")
    nodim = [i for i in p.imgs if not (i["w"] and i["h"]) and "fill" not in str(i)]
    info("Images without width/height (layout shift risk)", f"{len(nodim)} of {len(p.imgs)}")
    G["img_urls"] += [urljoin(p.url, i["src"]) for i in p.imgs if i["src"]]


# ----------------------------------------------------------------------------- search
def s_search():
    R.sec("8. Site search")
    home = G["home"]
    if not home:
        return
    has_input = any((i.get("type") == "search") or "search" in (i.get("aria-label", "") + i.get("placeholder", "") + i.get("name", "")).lower() for i in home.inputs)
    has_link = any("search" in (a["href"] + a["t"] + a["label"]).lower() for a in home.anchors + home.buttons if "href" in a) or any("search" in (b["t"] + b["label"]).lower() for b in home.buttons)
    (ok if has_input or has_link else fail)("Search entry point in header", "found" if has_input or has_link else "no search box or icon found")
    for path in (f"/{A.country}/search?q=dress", f"/{A.country}/search?query=dress", f"/{A.country}/search"):
        r = http(A.base + path)
        if r["status"] == 200:
            ok("Search results page", path)
            return
    fail("Search results page", "no /search route responds 200 - build search (see next step)")


# ----------------------------------------------------------------------------- cookies & trackers
TRACKERS = {
    "googletagmanager": "Google Tag Manager", "google-analytics": "Google Analytics", "gtag/js": "Google gtag",
    "connect.facebook.net": "Meta Pixel", "clarity.ms": "MS Clarity", "hotjar": "Hotjar", "tiktok": "TikTok Pixel",
    "snap.licdn": "LinkedIn", "static.ads-twitter": "X Ads", "pinimg": "Pinterest tag", "klaviyo": "Klaviyo",
}
CMP = ["cookiebot", "onetrust", "iubenda", "termly", "cookieyes", "osano", "complianz", "usercentrics", "cookie-consent", "cookieconsent", "cookie-banner", "cookiebanner"]
NONESSENTIAL = re.compile(r"^(_ga|_gid|_gat|_fbp|_fbc|_gcl|_hj|_clck|_clsk|_ttp|_pin|ajs_|mp_|_uet|ph_)", re.I)


def s_consent():
    R.sec("9. Cookies, trackers and consent")
    home = G["home"]
    if not home:
        return
    html = home.html.lower()
    srcs = " ".join((s["src"] or "") for s in home.scripts).lower() + " " + html
    found = sorted({v for k, v in TRACKERS.items() if k in srcs})
    cmp_found = [c for c in CMP if c in html]
    banner_text = bool(re.search(r"(we|this site) use[s]? cookies|accept (all )?cookies|cookie (preferences|settings)", home.text, re.I))
    r = http(A.base + "/")
    cks = [c.split("=")[0].strip() for c in r["cookies"]]
    non_ess = [c for c in cks if NONESSENTIAL.match(c)]
    info("Cookies set on first visit (before any consent)", ", ".join(cks) or "none")
    (ok if not non_ess else fail)("No non-essential cookies before consent", ", ".join(non_ess) or "none set")
    if found:
        (ok if (cmp_found or banner_text) else fail)("Trackers present: " + ", ".join(found), "consent banner detected" if (cmp_found or banner_text) else "NO consent mechanism detected; trackers must not load until opt-in")
    else:
        info("No analytics/marketing trackers in page source", "good for now; consent banner needed BEFORE adding analytics, Meta Pixel, or marketing email tracking")
    (ok if (cmp_found or banner_text) else warn)("Consent banner / preference centre", ", ".join(cmp_found) or ("text found" if banner_text else "not detected in server HTML"))
    third = Counter(host_of(urljoin(home.url, s["src"])) for s in home.scripts if s["src"] and host_of(urljoin(home.url, s["src"])) != host_of(A.base))
    info("Third-party script hosts", ", ".join(f"{h}" for h in third) or "none")
    nl = [i for i in home.inputs if i.get("type") == "email"]
    if nl:
        (ok if re.search(r"privacy|unsubscribe|consent|marketing", home.text, re.I) else warn)("Newsletter signup has privacy/consent wording", "PECR: clear opt-in wording + link to privacy policy")
    else:
        info("No email signup field in homepage HTML", "")


# ----------------------------------------------------------------------------- images / performance
def s_media():
    R.sec("10. Images and performance")
    pages = [G["home"]] + [p for _, _, p in G["pdps"]]
    urls = list(G["img_urls"])
    for p in pages:
        if p:
            urls += [urljoin(p.url, i["src"]) for i in p.imgs if i["src"]]
    urls = [u for u in dict.fromkeys(urls) if not u.startswith("data:")]
    allhtml = "".join(p.html for p in pages if p) + (G["plp"][2].html if G["plp"] else "")
    (ok if "r2.dev" not in allhtml else fail)("No leftover r2.dev URLs", "clean" if "r2.dev" not in allhtml else "found r2.dev in page HTML")
    (ok if "localhost" not in allhtml and "127.0.0.1" not in allhtml else fail)("No localhost URLs in HTML", "")
    media_host = host_of(A.media)
    non_media = [u for u in urls if media_host not in u and host_of(u) != host_of(A.base)]
    info("Image hosts", ", ".join(sorted({host_of(u) for u in urls})) or "none")
    if non_media:
        warn("Images from unexpected hosts", ", ".join(sorted({host_of(u) for u in non_media})))
    sample = [u for u in urls if not u.lower().endswith(".svg")][:10]

    def head(u):
        r = http(u, method="HEAD", timeout=15)
        if r["status"] in (403, 405, 0):
            r = http(u, timeout=15, max_bytes=3_000_000)
            r["headers"]["content-length"] = r["headers"].get("content-length") or str(r["bytes"])
        return u, r
    with ThreadPoolExecutor(5) as ex:
        res = list(ex.map(head, sample))
    big, legacy, nocache = [], [], []
    for u, r in res:
        size = int(r["headers"].get("content-length") or 0)
        ct = r["headers"].get("content-type", "")
        if size > 300_000:
            big.append((u, size))
        if ct and not re.search(r"webp|avif|svg", ct):
            legacy.append(ct)
        if "max-age" not in r["headers"].get("cache-control", ""):
            nocache.append(u)
    if sample:
        (ok if not big else warn)(f"Image weight (sampled {len(sample)})", "all under 300 KB" if not big else f"{len(big)} over 300 KB, largest {max(s for _, s in big)//1024} KB - resize/compress to WebP at upload")
        (ok if not legacy else warn)("Modern image formats (WebP/AVIF)", "yes" if not legacy else f"{len(legacy)} of {len(sample)} are JPEG/PNG")
        (ok if not nocache else warn)("Images have long cache headers", f"{len(nocache)} without max-age")
    else:
        warn("No images found to sample")
    if G["home"]:
        info("HTML size (homepage)", f"{http(A.base + '/' + A.country)['bytes']//1024} KB uncompressed")
        info("Script tags on homepage", str(len([s for s in G["home"].scripts if s["src"]])))
        eager = [i for i in G["home"].imgs if i["loading"] != "lazy"]
        info("Homepage images not lazy-loaded", f"{len(eager)} (hero image should be eager, the rest lazy)")


# ----------------------------------------------------------------------------- accessibility
def s_a11y():
    R.sec("11. Accessibility (static checks, partial - not a full WCAG audit)")
    pages = [("home", G["home"])] + [(urlparse(u).path[-25:], p) for u, _, p in G["pdps"][:1]] + ([("category", G["plp"][2])] if G["plp"] else [])
    for name, p in pages:
        if not p:
            continue
        vp = p.meta.get("viewport", "")
        if re.search(r"user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b", vp):
            fail(f"[{name}] Zoom disabled in viewport", vp)
        noalt = [i for i in p.imgs if i["alt"] is None]
        (ok if not noalt else fail)(f"[{name}] images with no alt attribute", str(len(noalt)))
        bl = [b for b in p.buttons if not (b["t"] or b["label"])]
        (ok if not bl else warn)(f"[{name}] buttons with no text/aria-label", str(len(bl)))
        al = [a for a in p.anchors if a["href"] and not (a["t"] or a["label"])]
        (ok if not al else warn)(f"[{name}] links with no text/aria-label (icon-only)", str(len(al)))
        unl = [i for i in p.inputs if i.get("type") not in ("hidden", "submit", "button", "checkbox", "radio") and not (i.get("aria-label") or i.get("aria-labelledby") or i.get("id") in p.label_for or i.get("_in_label") or i.get("title"))]
        (ok if not unl else warn)(f"[{name}] form fields without a label", f"{len(unl)} (placeholder alone is not a label)" if unl else "0")
        lv = [h["lvl"] for h in p.headings]
        jumps = [(a, b) for a, b in zip(lv, lv[1:]) if b - a > 1]
        (ok if not jumps else warn)(f"[{name}] heading order", "no skipped levels" if not jumps else f"{len(jumps)} skipped levels")
    h = G["home"]
    if h:
        skip = any(re.search(r"skip to", a["t"], re.I) for a in h.anchors)
        (ok if skip else warn)("Skip-to-content link", "" if skip else "add a visually-hidden 'Skip to main content' link")
    pal = {"wine": "7A3B44", "rosedeep": "904E62", "blush": "F0D9D4", "ink": "2A1A1D", "ivory": "FAF3F0", "white": "FFFFFF"}
    ink60 = blend(pal["ink"], pal["ivory"], 0.65)  # muted text is text-ink/65 on the site
    pairs = [("ink on ivory (body)", "ink", "ivory"), ("ink/65 on ivory (muted text)", ink60, "ivory"), ("wine on ivory (links)", "wine", "ivory"),
             ("ivory on wine (buttons)", "ivory", "wine"), ("wine on blush", "wine", "blush"), ("ink/65 on blush", None, "blush"),
             ("mid-rose-deep on ivory (rose text)", "rosedeep", "ivory"), ("mid-rose-deep on blush", "rosedeep", "blush"), ("ivory on mid-rose-deep (buttons)", "ivory", "rosedeep")]
    for label, fg, bg in pairs:
        f = ink60 if fg is None and "blush" in label else (fg if fg and re.fullmatch(r"[0-9A-F]{6}", fg) else pal.get(fg))
        if fg is None:
            f = blend(pal["ink"], pal["blush"], 0.65)
        c = contrast(f, pal[bg])
        st = ok if c >= 4.5 else warn if c >= 3 else fail
        st(f"Contrast {label}", f"{c:.2f}:1 " + ("(AA pass)" if c >= 4.5 else "(passes only for large text/UI, fails body text)" if c >= 3 else "(fails)"))


# ----------------------------------------------------------------------------- API / exposure
def s_api():
    R.sec("12. Backend / API exposure")
    h = http(A.api + "/health")
    (ok if h["status"] == 200 else fail)("API /health", str(h["status"]))
    ap = http(A.api + "/app")
    info("Admin UI /app", f"{ap['status']} (reachable publicly: use a strong unique password + 2FA-style hygiene; consider Cloudflare Access or IP allow-list)")
    s = http(A.api + "/store/products")
    (ok if s["status"] in (400, 401, 403) else warn)("Store API without publishable key is refused", str(s["status"]))
    ad = http(A.api + "/admin/orders")
    (ok if ad["status"] in (401, 403) else warn)("Admin API requires auth", f"{ad['status']} (expected 401)")
    evil = "https://evil.example"
    c = http(A.api + "/store/products", headers={"Origin": evil})
    acao = c["headers"].get("access-control-allow-origin", "")
    (ok if acao not in ("*", evil) else fail)("CORS does not allow arbitrary origins", acao or "no ACAO header")
    if is_https(A.api):
        try:
            ip = socket.gethostbyname(host_of(A.api))
        except Exception:
            ip = None
        if ip:
            for port, label, must_closed in ((9000, "Medusa 9000", True), (8000, "Storefront 8000", True), (3000, "Next 3000", True), (5432, "Postgres 5432", True), (6379, "Redis 6379", True), (22, "SSH 22", False)):
                s2 = socket.socket()
                s2.settimeout(3)
                try:
                    s2.connect((ip, port))
                    opened = True
                except Exception:
                    opened = False
                finally:
                    s2.close()
                if must_closed:
                    (fail if opened else ok)(f"Port {label} from the internet", "OPEN - close it in OCI security list/iptables" if opened else "closed")
                else:
                    info(f"Port {label} from the internet", "open (expected); use key-only auth, disable password login")


# ----------------------------------------------------------------------------- email DNS
def dig(name, typ="TXT"):
    try:
        out = subprocess.run(["dig", "+short", typ, name], capture_output=True, text=True, timeout=10).stdout
        return [l.strip().strip('"') for l in out.splitlines() if l.strip()]
    except Exception:
        return None


def s_email():
    R.sec("13. Email DNS (deliverability)")
    dom = host_of(A.base).replace("www.", "")
    probe = dig(dom)
    if probe is None:
        info("dig not available", "skipped")
        return
    sub = A.mail_domain
    for d in (dom, sub):
        t = dig(d) or []
        spf = [x for x in t if x.lower().startswith("v=spf1")]
        (ok if spf else warn)(f"SPF on {d}", spf[0][:80] if spf else "none (Resend sending subdomain usually has its own SPF on send.<sub>)")
    dm = [x for x in (dig(f"_dmarc.{dom}") or []) if x.lower().startswith("v=dmarc1")]
    if not dm:
        fail("DMARC record", f"none at _dmarc.{dom} - add v=DMARC1; p=none; rua=mailto:you@{dom} (Gmail/Yahoo require it)")
    else:
        pol = re.search(r"p=(\w+)", dm[0])
        pol = pol.group(1) if pol else "?"
        (ok if pol in ("quarantine", "reject") else warn)("DMARC policy", f"p={pol}" + (" (ok to start; move to quarantine after a few weeks of clean reports)" if pol == "none" else ""))
    dk = dig(f"resend._domainkey.{sub}")
    (ok if dk and any("p=" in x for x in dk) else warn)(f"Resend DKIM resend._domainkey.{sub}", "found" if dk else "not found (check your Resend domain page for the exact selector)")


# ----------------------------------------------------------------------------- repo
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", ".turbo", ".medusa", "__pycache__", ".venv"}


def grep(root, pattern, exts=(".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".yml", ".yaml"), flags=re.I, limit=8):
    rx, hits = re.compile(pattern, flags), []
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            if f.endswith(exts) and f != "package-lock.json":
                path = os.path.join(dp, f)
                try:
                    for i, line in enumerate(open(path, encoding="utf-8", errors="ignore"), 1):
                        if rx.search(line):
                            hits.append((os.path.relpath(path, root), i, line.strip()[:110]))
                            if len(hits) >= limit:
                                return hits
                except Exception:
                    pass
    return hits


def read_env(paths):
    out = {}
    for p in paths:
        if os.path.isfile(p):
            for line in open(p, encoding="utf-8", errors="ignore"):
                m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)", line)
                if m:
                    out.setdefault(m.group(1), m.group(2).strip().strip('"\''))
    return out


def s_repo():
    R.sec("14. Source code checks (--repo)")
    repo = os.path.expanduser(A.repo)
    sf, be = os.path.join(repo, "apps/storefront"), os.path.join(repo, "apps/backend")
    if not os.path.isdir(sf):
        warn("Repo not found", repo)
        return
    sfs, bes = os.path.join(sf, "src"), os.path.join(be, "src")

    # Payments
    pe = grep(sfs, r"\bPaymentElement\b|ExpressCheckoutElement")
    ce = grep(sfs, r"\bCardElement\b")
    if pe:
        ok("Checkout uses Stripe PaymentElement/ExpressCheckout", f"{pe[0][0]}:{pe[0][1]}")
    elif ce:
        fail("Checkout uses card-only CardElement", f"{ce[0][0]}:{ce[0][1]} - Apple Pay, Google Pay and Klarna will NOT appear in live mode until this is switched to PaymentElement")
    else:
        warn("Could not find Stripe element in storefront", "")
    apm = grep(be, r"automaticPaymentMethods|automatic_payment_methods|payment_method_types|paymentMethodTypes", limit=3)
    (ok if apm else warn)("Backend Stripe provider payment-method options", f"{apm[0][0]}:{apm[0][1]}" if apm else "none set in medusa-config; wallets/BNPL need automaticPaymentMethods:true or explicit types")
    env = read_env([os.path.join(repo, n) for n in (".env", ".env.production", ".env.local")] + [os.path.join(d, n) for d in (sf, be) for n in (".env", ".env.local", ".env.production")])
    modes = {}
    for k, v in env.items():
        if "STRIPE" in k and re.match(r"(pk|sk|rk)_(test|live)_", v):
            modes[k] = ("TEST" if "_test_" in v[:8] else "LIVE")
    if modes:
        info("Stripe keys detected (values not printed)", ", ".join(f"{k}={m}" for k, m in modes.items()))
        (ok if len(set(modes.values())) == 1 else fail)("Stripe key modes consistent", "all " + list(modes.values())[0] if len(set(modes.values())) == 1 else "MIXED test/live keys")
    wh = [k for k in env if "STRIPE" in k and "WEBHOOK" in k]
    (ok if wh else warn)("Stripe webhook secret configured locally", ", ".join(wh) or "none found in local .env (VM .env matters more)")
    info("Go-live Stripe switch", "needs: live pk/sk, new LIVE webhook endpoint + secret, storefront REBUILD (NEXT_PUBLIC_* is baked in at build), register domain for Apple Pay in Stripe dashboard, enable Klarna/Clearpay in Dashboard > Payment methods")

    # SEO / structured data
    ld = grep(sfs, r"application/ld\+json")
    (ok if ld else fail)("JSON-LD structured data in storefront", f"{ld[0][0]}" if ld else "none - add Product, BreadcrumbList, Organization")

    # Search
    srch = []
    for dp, dn, fn in os.walk(sfs):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for d in dn:
            if d.lower() == "search":
                srch.append(os.path.relpath(os.path.join(dp, d), sfs))
    (ok if srch else fail)("Search route/module in storefront", ", ".join(srch[:3]) if srch else "none")

    # Consent / analytics
    cm = grep(sfs, r"cookie[-_ ]?(consent|banner|preferences)|ConsentBanner|CookieConsent")
    (ok if cm else fail)("Cookie consent component", cm[0][0] if cm else "none in source")
    an = grep(sfs, r"googletagmanager|gtag\(|fbq\(|plausible|posthog|@next/third-parties|@vercel/analytics", limit=3)
    info("Analytics code in storefront", an[0][0] if an else "none yet")
    if an and not cm:
        fail("Analytics present without consent component", "gate it behind consent")

    # Legal routes
    routes = []
    for sub in ("app/[countryCode]/(main)", "app/[countryCode]/(checkout)", "app/[countryCode]", "app"):
        d = os.path.join(sfs, sub)
        if os.path.isdir(d):
            routes += [x for x in os.listdir(d) if os.path.isdir(os.path.join(d, x))]
    legal_hits = sorted({r for r in routes if re.search(r"return|terms|privacy|cookie|shipping|delivery|contact|faq|about|content|pages|policies", r, re.I)})
    (ok if legal_hits else fail)("Legal/content routes in storefront", ", ".join(legal_hits) or "none")
    info("Storefront top-level routes", ", ".join(sorted(set(routes)))[:150])

    # Emails
    ev = set()
    for _, _, line in grep(bes, r"event\s*:\s*|eventName|order\.|auth\.|customer\.|shipment|fulfillment", limit=60):
        ev.update(re.findall(r"['\"]((?:order|auth|customer|shipment|delivery|fulfillment|return)\.[\w.]+)['\"]", line))
    info("Backend events handled", ", ".join(sorted(ev)) or "none found")
    need = {"order confirmation": r"order\.placed", "dispatch/tracking email": r"shipment\.created|order\.fulfillment_created|fulfillment\.created|delivery\.created",
            "cancellation email": r"order\.canceled", "password reset email": r"auth\.password_reset|customer\.password_reset", "return/refund email": r"return|refund"}
    evs = " ".join(ev)
    for label, rx in need.items():
        (ok if re.search(rx, evs) else fail if label in ("order confirmation", "dispatch/tracking email", "password reset email") else warn)(f"Transactional email: {label}", "")
    # Newsletter
    nl = grep(sfs, r"newsletter|subscribe", limit=6)
    nl_action = [h for h in nl if re.search(r"fetch\(|action|api/|resend|server", h[2], re.I)]
    (ok if nl_action else warn)("Newsletter signup wired to a backend/Resend audience", nl_action[0][0] if nl_action else "form exists but no submit handler found" if nl else "no newsletter code")
    # Next config
    nc = grep(sf, r"unoptimized|poweredByHeader|remotePatterns", exts=(".js", ".mjs", ".ts"), limit=5)
    info("next.config image/header settings", "; ".join(f"{h[2][:50]}" for h in nc) or "none")
    # Docker / Caddy
    comp = [os.path.join(repo, f) for f in os.listdir(repo) if re.match(r"docker-compose.*\.ya?ml", f)]
    for cf in comp[:1]:
        txt = open(cf, encoding="utf-8", errors="ignore").read()
        (ok if "restart:" in txt else fail)("docker-compose restart policy", "set" if "restart:" in txt else "missing: containers will not come back after a VM reboot")
        (ok if "healthcheck" in txt else warn)("docker-compose healthchecks", "present" if "healthcheck" in txt else "none")
    cad = []
    for dp, dn, fn in os.walk(repo):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        cad += [os.path.join(dp, f) for f in fn if f.lower().startswith("caddyfile")]
    for c in cad[:1]:
        t = open(c, encoding="utf-8", errors="ignore").read()
        (ok if re.search(r"\bencode\b", t) else warn)("Caddy compression (encode)", "set" if "encode" in t else "not set")
        (ok if re.search(r"Strict-Transport|header\s*\{|header ", t, re.I) else warn)("Caddy security headers", "present" if re.search(r"header", t, re.I) else "none set")


# ----------------------------------------------------------------------------- VM
def s_vm():
    R.sec("15. VM health via SSH (--vm)")
    script = (
        "echo '##CRON'; crontab -l 2>/dev/null; "
        "echo '##SCRIPT'; for f in $(crontab -l 2>/dev/null | grep -v '^#' | grep -o '/[^ ]*\\.sh'); do grep -o -E 'pg_dump|rclone' \"$f\" 2>/dev/null; done | sort -u; "
        "echo '##BK'; stat -c '%Y %s %n' ~/backups/*.dump 2>/dev/null | sort -rn | head -3; "
        "echo '##MEM'; free -m; "
        "echo '##DISK'; df -h / | tail -1; "
        "echo '##DOCKER'; docker ps --format '{{.Names}}|{{.Status}}' 2>&1; "
        "echo '##RESTART'; docker inspect -f '{{.Name}}|{{.HostConfig.RestartPolicy.Name}}' $(docker ps -q) 2>&1; "
        "echo '##NOW'; date +%s"
    )
    try:
        out = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", A.vm, script], capture_output=True, text=True, timeout=45)
    except Exception as e:
        warn("SSH failed", str(e))
        return
    if out.returncode != 0 and "##CRON" not in out.stdout:
        warn("SSH failed", out.stderr.strip()[:150])
        return
    parts = dict(re.findall(r"##(\w+)\n(.*?)(?=\n##|\Z)", out.stdout, re.S))
    cron = parts.get("CRON", "") + "\n" + parts.get("SCRIPT", "")  # crontab text plus tokens found in scripts it runs
    (ok if "pg_dump" in cron else warn)("Backup cron job", "pg_dump found in crontab" if "pg_dump" in cron else "no pg_dump in crontab")
    (ok if re.search(r"rclone|aws |s3|rsync|scp|r2|gsutil", cron) else fail)("OFF-VM backup copy", "found in cron" if re.search(r"rclone|aws |s3|rsync|scp|r2|gsutil", cron) else "none - backups sit on the same VM they protect; copy them to R2 (rclone)")
    now = int((parts.get("NOW") or "0").strip() or 0)
    bk = [l.split() for l in (parts.get("BK") or "").splitlines() if l.strip()]
    if bk and now:
        age = (now - int(bk[0][0])) / 3600
        (ok if age < 30 else fail)("Newest backup age", f"{age:.1f} h, {int(bk[0][1])//1024} KB")
        if int(bk[0][1]) < 10_000:
            warn("Newest backup is tiny", "verify it is a real dump")
    else:
        fail("Backups found in ~/backups", "none")
    mem = parts.get("MEM", "")
    m = re.search(r"Mem:\s+(\d+)\s+(\d+)\s+(\d+)", mem)
    sw = re.search(r"Swap:\s+(\d+)\s+(\d+)", mem)
    if m:
        info("Memory (MB) total/used/free", f"{m.group(1)}/{m.group(2)}/{m.group(3)}")
    if sw:
        (ok if int(sw.group(1)) >= 1024 else warn)("Swap", f"{sw.group(1)} MB" + ("" if int(sw.group(1)) >= 1024 else " - 1 GB RAM box needs 2-4 GB swap to survive builds/traffic spikes"))
    info("Disk /", (parts.get("DISK") or "").strip())
    dk = [l for l in (parts.get("DOCKER") or "").splitlines() if "|" in l]
    unh = [l for l in dk if not re.search(r"\bUp\b", l)]
    (ok if dk and not unh else fail)("Containers running", f"{len(dk)} up" if dk and not unh else "problem: " + "; ".join(unh or ["none running / docker needs sudo"]))
    rp = [l for l in (parts.get("RESTART") or "").splitlines() if "|" in l]
    badr = [l for l in rp if l.split("|")[1] in ("no", "")]
    (ok if rp and not badr else fail)("Container restart policy", "all set" if rp and not badr else "missing on: " + ", ".join(l.split("|")[0] for l in badr))


# ----------------------------------------------------------------------------- manual list + output
MANUAL = [
    "Uptime monitor (UptimeRobot / BetterStack free) on / , /gb and api /health with email + SMS alerts",
    "Stripe live mode: register maryshubic.com for Apple Pay, enable Klarna/Clearpay + wallets, create live webhook, rebuild storefront",
    "Complete a real GBP test checkout on a phone: delivery cost visible BEFORE the pay step, total matches Stripe, confirmation email arrives, order shows in admin",
    "Restore test: restore the latest pg_dump into a throwaway local Postgres to prove backups work",
    "Legal copy review by you/solicitor: returns (14-day cancellation + pre-owned wording), terms, privacy, cookies",
    "Resend: upgrade plan before public launch; send a test to Gmail + Outlook and check it lands in inbox, not spam",
    "Google Search Console + Bing Webmaster: verify domain, submit sitemap; set .co.uk to redirect or canonical to .com",
]


def finish():
    c = Counter(r["status"] for r in R.rows)
    print(f"\n{BOLD}=== SUMMARY ==={RST}")
    print(f"  {COL['PASS']}PASS {c['PASS']}{RST}   {COL['WARN']}WARN {c['WARN']}{RST}   {COL['FAIL']}FAIL {c['FAIL']}{RST}   {COL['INFO']}INFO {c['INFO']}{RST}")
    print(f"\n{BOLD}Manual checks (cannot be automated):{RST}")
    for m in MANUAL:
        print("  [ ] " + m)
    ts = datetime.now().strftime("%Y%m%d-%H%M")
    md = [f"# Mary Shubic audit - {datetime.now():%d %b %Y %H:%M}", f"Target: {A.base}  |  PASS {c['PASS']}  WARN {c['WARN']}  FAIL {c['FAIL']}  INFO {c['INFO']}", ""]
    sec = None
    for r in R.rows:
        if r["section"] != sec:
            sec = r["section"]
            md += ["", f"## {sec}", "", "| Status | Check | Detail |", "|---|---|---|"]
        md.append(f"| {r['status']} | {r['check']} | {r['detail'].replace('|','/')} |")
    md += ["", "## Manual checks", ""] + [f"- [ ] {m}" for m in MANUAL]
    open(f"audit-report-{ts}.md", "w", encoding="utf-8").write("\n".join(md))
    json.dump(R.rows, open(f"audit-report-{ts}.json", "w"), indent=1)
    print(f"\nSaved: audit-report-{ts}.md  (upload this file to Claude chat)")
    return 1 if c["FAIL"] else 0


def main():
    global A
    ap = argparse.ArgumentParser(description="Mary Shubic pre-launch audit")
    ap.add_argument("--base", default="https://www.maryshubic.com")
    ap.add_argument("--api", default="https://api.maryshubic.com")
    ap.add_argument("--media", default="https://media.maryshubic.com")
    ap.add_argument("--country", default="gb")
    ap.add_argument("--mail-domain", default="mail.maryshubic.com")
    ap.add_argument("--repo", help="path to mary-shubic-medusa-store (enables source checks)")
    ap.add_argument("--vm", help="SSH alias, e.g. oracle-store (enables VM checks)")
    A = ap.parse_args()
    A.base = A.base.rstrip("/")
    print(f"{BOLD}Mary Shubic audit{RST}  {A.base}  ({datetime.now():%Y-%m-%d %H:%M})")
    steps = [s_infra, s_seo, s_discover, s_legal, s_pricing, s_pdp, s_plp, s_search, s_consent, s_media, s_a11y, s_api, s_email]
    if A.repo:
        steps.append(s_repo)
    if A.vm:
        steps.append(s_vm)
    for fn in steps:
        try:
            fn()
        except Exception as e:
            R.sec(fn.__name__)
            warn(f"{fn.__name__} crashed", f"{type(e).__name__}: {e}")
    sys.exit(finish())


if __name__ == "__main__":
    main()
