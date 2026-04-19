"""Ping IndexNow with all URLs from sitemap.

Usage: python3 scripts/indexnow_ping.py [URL1 URL2 ...]
No args = ping all URLs from sitemap-0.xml.
"""
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import json

HOST = "litiere-agglomerante.com"
KEY = "9e5df87cd98341a3b0f80bba1b9d6ad4"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
SITEMAP = f"https://{HOST}/sitemap-0.xml"


def fetch_sitemap_urls():
    req = urllib.request.Request(SITEMAP, headers={"User-Agent": "Mozilla/5.0 litierescore-indexnow"})
    with urllib.request.urlopen(req, timeout=20) as r:
        xml_data = r.read()
    root = ET.fromstring(xml_data)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]


def ping(urls):
    if not urls:
        print("No URLs to ping")
        return
    body = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "litierescore-indexnow/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow {r.status} {r.reason} on {len(urls)} urls")
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTP {e.code}: {e.read().decode(errors='ignore')}")
    except Exception as e:
        print(f"IndexNow error: {e}")


if __name__ == "__main__":
    urls = sys.argv[1:] or fetch_sitemap_urls()
    print(f"Pinging {len(urls)} URLs")
    ping(urls)
