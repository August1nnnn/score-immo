"""Notify IndexNow after a successful production deployment.

Usage:
  python3 scripts/indexnow_ping.py [URL1 URL2 ...]
  python3 scripts/indexnow_ping.py --changed-files PATH [PATH ...]
  python3 scripts/indexnow_ping.py --changed-file-list FILE

No URL or changed-file option submits the complete live sitemap. Changed
article/page files are mapped to their public URLs; shared templates fall back
to the complete sitemap because they can alter every generated page.
"""
import argparse
from pathlib import Path
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import json

HOST = "score-immo.fr"
KEY = "aa87fc9bfd0440f08e944eb5a26837e3"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
SITEMAP = f"https://{HOST}/sitemap-0.xml"
REPO_ROOT = Path(__file__).resolve().parent.parent

GLOBAL_PREFIXES = (
    "src/components/",
    "src/layouts/",
    "src/styles/",
)
GLOBAL_FILES = {
    "astro.config.mjs",
    "package.json",
    "src/data/homepage-jsonld.ts",
}


def fetch_sitemap_urls():
    req = urllib.request.Request(SITEMAP, headers={"User-Agent": "Mozilla/5.0 scoreimmo-indexnow"})
    with urllib.request.urlopen(req, timeout=20) as r:
        xml_data = r.read()
    root = ET.fromstring(xml_data)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]


def changed_files_to_urls(paths):
    urls = []

    for raw_path in paths:
        path = raw_path.strip().replace("\\", "/")
        if not path:
            continue

        if path.startswith(GLOBAL_PREFIXES) or path in GLOBAL_FILES:
            return None

        if path.startswith("src/content/articles/") and path.endswith(".json"):
            article_path = REPO_ROOT / path
            try:
                article = json.loads(article_path.read_text(encoding="utf-8"))
                blog = article["blog"].strip("/")
                handle = article["handle"].strip("/")
            except (OSError, KeyError, TypeError, json.JSONDecodeError):
                # Deleted or malformed content still needs removal discovery.
                parts = Path(path).parts
                if len(parts) < 5:
                    return None
                blog = parts[-2]
                handle = Path(parts[-1]).stem
            urls.append(f"https://{HOST}/blogs/{blog}/{handle}")
            urls.append(f"https://{HOST}/blogs/{blog}")
            continue

        if path.startswith("src/data/pages/") and path.endswith(".json"):
            urls.append(f"https://{HOST}/pages/{Path(path).stem}")
            continue

        if path == "src/pages/index.astro":
            urls.append(f"https://{HOST}/")
            continue

        if path == "src/pages/pro.astro":
            urls.append(f"https://{HOST}/pro")
            continue

        if path.startswith("src/pages/") and path.endswith(".astro"):
            if "[" in path or "]" in path:
                return None
            route = path.removeprefix("src/pages/").removesuffix(".astro")
            route = route.removesuffix("/index")
            urls.append(f"https://{HOST}/{route}".rstrip("/"))
            continue

        if path == "public/llms.txt":
            urls.append(f"https://{HOST}/llms.txt")
            continue

        if path.startswith(("src/", "public/")):
            return None

    return list(dict.fromkeys(urls))


def ping(urls):
    if not urls:
        print("No URLs to ping")
        return True
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
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "scoreimmo-indexnow/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow {r.status} {r.reason} on {len(urls)} urls")
            return True
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTP {e.code}: {e.read().decode(errors='ignore')}")
    except Exception as e:
        print(f"IndexNow error: {e}")
    return False


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="*")
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--changed-files", nargs="+")
    source.add_argument("--changed-file-list")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    changed_files = args.changed_files
    if args.changed_file_list:
        changed_files = Path(args.changed_file_list).read_text(encoding="utf-8").splitlines()

    urls = args.urls
    if changed_files is not None:
        urls = changed_files_to_urls(changed_files)
    if urls is None or (not urls and changed_files is None):
        urls = fetch_sitemap_urls()

    print(f"Pinging {len(urls)} URLs")
    if args.dry_run:
        for url in urls:
            print(url)
    else:
        if not ping(urls):
            sys.exit(1)
