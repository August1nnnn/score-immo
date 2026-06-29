#!/usr/bin/env python3
"""
ScoreImmo Blog Auto v2 -- queue-only mode (zero Anthropic API).

Reads blog-auto/articles.json (editorial plan), picks the next unpublished article whose
scheduled_datetime has passed, pre-fetches an Unsplash image, and writes a spec file in
blog-auto/queue/{index}.json. The Routine claude.ai then polls the queue, generates the
article JSON per blog-auto/prompts/article-scoreimmo.md, writes it to
src/content/articles/{blog}/{slug}.json, marks the entry published in articles.json,
removes the queue spec, and commits (-> Cloudflare Pages auto-deploy).

NO Claude/Anthropic API call here. Pure scheduling + Unsplash + queue file write.
Source de generation = Routine claude.ai (abo Max), pas l'API payante.

Usage :
  python publish.py            # queue le prochain article echu
  python publish.py --force    # queue le prochain article non publie (bypass schedule)
  python publish.py --dry-run  # affiche le spec sans ecrire/commit
"""
from __future__ import annotations

import argparse
import datetime
import json
import logging
import os
import re
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent
ARTICLES_JSON = SCRIPT_DIR / "articles.json"
QUEUE_DIR = SCRIPT_DIR / "queue"
PROMPT_REF = "blog-auto/prompts/article-scoreimmo.md"
CONTENT_DIR = REPO_DIR / "src" / "content" / "articles"
LOG_DIR = SCRIPT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "publish.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("scoreimmo-blog")

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")

SLUG_STOPS = {
    "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "a", "au",
    "aux", "par", "pour", "sur", "avec", "dans", "en", "est", "qui", "que",
}

# Unsplash query (EN) par categorie, pour une image coherente sans LLM.
IMG_QUERY_BY_CATEGORY = {
    "mandataire": "real estate agent france",
    "fiscalite": "french tax paperwork",
    "financement": "mortgage home loan",
    "juridique": "signing property contract",
    "diagnostics": "energy efficient house",
    "renovation": "home renovation",
    "urbanisme": "city urban planning",
    "montage": "real estate investment",
    "villes": "french city skyline",
    "quartiers": "french neighborhood street",
}


def slugify(title: str, max_len=60, max_words=8) -> str:
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    words = [w for w in s.split("-") if w and w not in SLUG_STOPS][:max_words]
    words = list(dict.fromkeys(words))  # dedupe preserving order (STACK-2026 slug fix)
    return "-".join(words)[:max_len].rstrip("-")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()


def load_plan() -> list:
    if not ARTICLES_JSON.exists():
        return []
    return json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))


def save_plan(plan: list):
    ARTICLES_JSON.write_text(
        json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def find_next(plan: list, force=False) -> dict | None:
    now = datetime.datetime.now(datetime.timezone.utc).astimezone()
    for entry in plan:
        if entry.get("published"):
            continue
        if force:
            return entry
        sch = entry.get("scheduled_datetime")
        if not sch:
            continue
        try:
            sch_dt = datetime.datetime.fromisoformat(sch.replace("Z", "+00:00"))
            if sch_dt.tzinfo is None:
                sch_dt = sch_dt.replace(tzinfo=datetime.timezone.utc)
            if sch_dt <= now:
                return entry
        except Exception:
            continue
    return None


def already_queued(index) -> bool:
    return (QUEUE_DIR / f"{index}.json").exists()


def already_published_file(blog: str, slug: str) -> bool:
    return (CONTENT_DIR / blog / f"{slug}.json").exists()


def unsplash_query(entry: dict) -> str:
    cat = entry.get("category") or entry.get("blog", "")
    base = IMG_QUERY_BY_CATEGORY.get(cat, "french real estate")
    if entry.get("blog") in ("villes", "quartiers"):
        # Detect a capitalised city name from the title (e.g. "Prix Immobilier Annecy 2026").
        cities = re.findall(r"\b([A-ZÀ-Ý][a-zà-ÿ]{3,})\b", entry.get("title", ""))
        stop = {"Prix", "Immobilier", "Meilleurs", "Quartiers", "Acheter"}
        cities = [c for c in cities if c not in stop]
        if cities:
            return f"{cities[0]} france city"
    return base


def unsplash_image(query: str) -> dict | None:
    if not UNSPLASH_ACCESS_KEY or not query:
        return None
    url = (
        "https://api.unsplash.com/search/photos?"
        f"query={urllib.parse.quote(query)}&orientation=landscape&per_page=1"
    )
    req = urllib.request.Request(url, headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"})
    try:
        r = urllib.request.urlopen(req, timeout=20)
        d = json.loads(r.read())
        if not d.get("results"):
            return None
        img = d["results"][0]
        return {
            "src": img["urls"]["regular"],
            "alt": img.get("alt_description") or query,
            "width": 1080,
            "height": 720,
        }
    except Exception as e:
        log.warning(f"  Unsplash failed: {e}")
        return None


def build_queue_spec(entry: dict, slug: str, image: dict | None) -> dict:
    """Tout ce dont la Routine claude.ai a besoin pour generer 1 article ScoreImmo conforme."""
    blog = entry["blog"]
    return {
        "index": entry["index"],
        "queued_at": now_iso(),
        "blog": blog,
        "category": entry.get("category", blog),
        "slug": slug,
        "title": entry["title"],
        "keywords": entry.get("keywords", ""),
        "author": entry.get("author", "Léa Moreau"),
        "author_handle": entry.get("author_handle", "lea-moreau"),
        "scheduled_date": entry.get("scheduled_date"),
        "image": image,  # pre-fetched Unsplash, a recopier tel quel dans l'article
        "output_path": f"src/content/articles/{blog}/{slug}.json",
        "prompt_file": PROMPT_REF,
        "live_url": f"https://score-immo.fr/blogs/{blog}/{slug}",
        "instructions": (
            f"Genere l'article FR en suivant STRICTEMENT {PROMPT_REF} "
            "(persona Lea Moreau, 3500+ mots body_html HTML pur, TL;DR 4 bullets, FAQ 5Q, "
            "H2 formules en questions langage naturel (GEO) + 1re phrase reponse directe sous chaque H2, "
            ">=2 sources officielles ancrees INLINE dans la prose au point du claim chiffre (GEO), "
            "5+ sources officielles FR total (dont les 2 inline), 5+ liens internes, "
            "1+ CTA app.score-immo.fr, zero em-dash, accents FR obligatoires, "
            "aucune fabrication de chiffre YMYL). "
            f"Ecris le JSON complet (schema dans {PROMPT_REF}) dans output_path en recopiant "
            "le champ image fourni. Puis : 1) marque cette entree published:true + published_at "
            "dans blog-auto/articles.json, 2) supprime blog-auto/queue/<index>.json, "
            "3) commit + push (-> deploy CF Pages)."
        ),
    }


def git_commit_push(index, slug: str, dry_run=False):
    if dry_run:
        log.info("  [dry-run] skip git")
        return
    try:
        subprocess.run(
            ["git", "add", "blog-auto/queue/", "blog-auto/articles.json"],
            cwd=str(REPO_DIR), check=True,
        )
        subprocess.run(
            ["git",
             "-c", "user.email=blog-bot@score-immo.fr",
             "-c", "user.name=ScoreImmo Blog Bot",
             "commit", "-m", f"chore(blog): queue article #{index} {slug}"],
            cwd=str(REPO_DIR), check=True,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=str(REPO_DIR), check=True)
        log.info("  Pushed queue spec to origin/main")
    except subprocess.CalledProcessError as e:
        log.error(f"  git failed: {e}")
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    plan = load_plan()
    if not plan:
        log.info("articles.json vide ou absent. Rien a queue.")
        return

    entry = find_next(plan, force=args.force)
    if not entry:
        log.info("Aucun article echu a queue (tous publies ou pas d'echeance).")
        return

    slug = entry.get("slug") or slugify(entry["title"])
    entry["slug"] = slug
    index = entry["index"]
    log.info(f"Article #{index} : {entry.get('title')} [{entry.get('blog')}/{entry.get('category','')}]")

    if already_published_file(entry["blog"], slug):
        log.warning(f"  DOUBLON: {slug}.json existe deja -> mark published + skip")
        entry["published"] = True
        entry["published_at"] = now_iso()
        save_plan(plan)
        git_commit_push(index, slug, dry_run=args.dry_run)
        return

    if already_queued(index):
        log.info(f"  Deja en file: blog-auto/queue/{index}.json (en attente de la Routine) -> skip")
        return

    image = unsplash_image(unsplash_query(entry))
    if image:
        log.info(f"  Image Unsplash: {image['src'][:60]}...")
    else:
        log.info("  Pas d'image (UNSPLASH_ACCESS_KEY absent ou 0 result)")

    spec = build_queue_spec(entry, slug, image)

    if args.dry_run:
        log.info("  [dry-run] spec :")
        print(json.dumps(spec, ensure_ascii=False, indent=2))
        return

    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    (QUEUE_DIR / f"{index}.json").write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    log.info(f"  Queued: blog-auto/queue/{index}.json")

    # On fige le slug dans le plan (mais PAS published: c'est la Routine qui publie).
    save_plan(plan)
    git_commit_push(index, slug, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
