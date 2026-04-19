#!/usr/bin/env python3
"""ScoreImmo GSC daily check.

Fetch les metriques GSC des 7 derniers jours vs 7 jours precedents.
Log un resume dans logs/gsc.log et stdout. Alerte si drop > 20%.

Usage : python gsc_daily_check.py
Env : GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN
"""
import datetime
import json
import logging
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
LOG_DIR = SCRIPT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "gsc.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("gsc")

SITE = "sc-domain:score-immo.fr"


def get_access_token() -> str:
    body = urllib.parse.urlencode({
        "client_id": os.environ["GSC_CLIENT_ID"],
        "client_secret": os.environ["GSC_CLIENT_SECRET"],
        "refresh_token": os.environ["GSC_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    r = urllib.request.urlopen(req, timeout=20)
    return json.loads(r.read())["access_token"]


def query(access_token: str, start: str, end: str, dimensions: list, limit=50) -> list:
    body = json.dumps({
        "startDate": start,
        "endDate": end,
        "dimensions": dimensions,
        "rowLimit": limit,
    }).encode()
    encoded_site = urllib.parse.quote(SITE, safe="")
    req = urllib.request.Request(
        f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/searchAnalytics/query",
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )
    r = urllib.request.urlopen(req, timeout=30)
    return json.loads(r.read()).get("rows", [])


def agg(rows, key="clicks"):
    return sum(r.get(key, 0) for r in rows)


def main():
    if not os.getenv("GSC_REFRESH_TOKEN"):
        log.error("GSC_REFRESH_TOKEN manquant")
        sys.exit(1)
    token = get_access_token()

    today = datetime.date.today()
    this_start = (today - datetime.timedelta(days=8)).isoformat()
    this_end = (today - datetime.timedelta(days=2)).isoformat()
    prev_start = (today - datetime.timedelta(days=15)).isoformat()
    prev_end = (today - datetime.timedelta(days=9)).isoformat()

    this_rows = query(token, this_start, this_end, ["date"], limit=14)
    prev_rows = query(token, prev_start, prev_end, ["date"], limit=14)

    this_clicks = agg(this_rows, "clicks")
    this_imp = agg(this_rows, "impressions")
    prev_clicks = agg(prev_rows, "clicks")
    prev_imp = agg(prev_rows, "impressions")

    def pct(new, old):
        if old == 0:
            return "n/a"
        return f"{((new - old) / old * 100):+.1f}%"

    log.info(f"=== GSC score-immo.fr ({this_start} -> {this_end}) ===")
    log.info(f"  Clicks 7j        : {this_clicks} ({pct(this_clicks, prev_clicks)} vs prev 7j)")
    log.info(f"  Impressions 7j   : {this_imp} ({pct(this_imp, prev_imp)} vs prev 7j)")
    log.info(f"  Baseline prev    : {prev_clicks} clicks, {prev_imp} imp")

    # Top pages
    top_pages = query(token, this_start, this_end, ["page"], limit=10)
    if top_pages:
        log.info("  Top 5 pages :")
        for p in top_pages[:5]:
            url = p["keys"][0].replace("https://score-immo.fr", "")
            log.info(f"    {p['clicks']:3d}c {p['impressions']:4d}i  {url}")

    # Top queries
    top_q = query(token, this_start, this_end, ["query"], limit=10)
    if top_q:
        log.info("  Top 5 requetes :")
        for q in top_q[:5]:
            log.info(f"    {q['clicks']:3d}c {q['impressions']:4d}i  '{q['keys'][0][:60]}'")

    # Alerte si drop > 20%
    if prev_clicks > 10 and (prev_clicks - this_clicks) / prev_clicks > 0.20:
        log.warning(f"  ⚠ DROP CLICKS > 20% ({this_clicks} vs {prev_clicks})")
    if prev_imp > 100 and (prev_imp - this_imp) / prev_imp > 0.20:
        log.warning(f"  ⚠ DROP IMPRESSIONS > 20% ({this_imp} vs {prev_imp})")

    # Sitemaps status
    encoded_site = urllib.parse.quote(SITE, safe="")
    req = urllib.request.Request(
        f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/sitemaps",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        r = urllib.request.urlopen(req, timeout=20)
        d = json.loads(r.read())
        for s in d.get("sitemap", []):
            log.info(f"  Sitemap {s['path']}: submitted={s['contents'][0].get('submitted','?') if s.get('contents') else '?'}, errors={s.get('errors','0')}, lastDownloaded={s.get('lastDownloaded','?')}")
    except Exception as e:
        log.warning(f"  Sitemap check failed: {e}")


if __name__ == "__main__":
    main()
