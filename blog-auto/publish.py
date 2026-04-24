#!/usr/bin/env python3
"""
ScoreImmo Blog Auto - publish next article.

Lit blog-auto/articles.json (plan editorial), trouve le prochain article non publie avec
scheduled_datetime passe, genere le contenu via Claude Sonnet 4.6 (ou Mistral+Claude-audit
si MISTRAL_API_KEY), ecrit un JSON au format src/content/articles/{blog}/{handle}.json,
commit + push vers Cloudflare Pages.

Standards STACK-2026 : 3500+ mots, TL;DR, FAQ 5Q, 5+ sources, zero em-dash,
author Person E-E-A-T.

Usage :
  python publish.py            # publier le prochain article echu
  python publish.py --force    # force le prochain article non publie
  python publish.py --dry-run  # genere sans commit/push
"""
import argparse
import datetime
import json
import logging
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(REPO_DIR / "scripts"))

ARTICLES_JSON = SCRIPT_DIR / "articles.json"
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

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

SLUG_STOPS = {
    "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "a", "au",
    "aux", "par", "pour", "sur", "avec", "dans", "en", "est", "qui", "que",
}


def strip_dashes(s: str) -> str:
    return s.replace("\u2014", "-").replace("\u2013", "-") if s else s


def slugify(title: str, max_len=60, max_words=8) -> str:
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    words = [w for w in s.split("-") if w and w not in SLUG_STOPS][:max_words]
    words = list(dict.fromkeys(words))  # dedupe preserving order (STACK-2026 slug fix)
    return "-".join(words)[:max_len].rstrip("-")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()


SYSTEM_PROMPT = """Tu es Lea Moreau, analyste marche immobilier francais depuis 2016, ancienne CGEDD, specialisee DVF, DPE, frais d'acquisition, urbanisme. Tu ecris pour ScoreImmo.

STANDARDS ABSOLUS (article rejete si non respectes) :
- LONGUEUR : 3500+ mots dans body_html (hors TL;DR, FAQ, sources).
- STRUCTURE : intro 200-300 mots avec chiffre cle dans le 1er paragraphe, 6 sections H2 minimum, sous-sections H3 quand pertinent, FAQ 5 questions a la fin.
- TON : tutoiement, francais concret, chiffres precis, aucun bullshit commercial.
- CONTRAINTES : ZERO tiret cadratin (em-dash, en-dash). Utilise virgule, deux-points, point, tiret simple. Accents francais obligatoires.
- HTML : body pur HTML5 (h2/h3/p/ul/ol/strong/a/table). Pas de markdown.
- CTA : 1 lien vers https://app.score-immo.fr/app minimum, integre naturellement.
- INTERNAL LINKS : 5+ liens vers /blogs/guides/*, /blogs/villes/*, /blogs/quartiers/*, /pages/outils, /pages/tarifs.
- EXTERNAL LINKS : 5+ liens inline vers sources officielles FR (service-public.fr, notaires.fr, data.gouv.fr, insee.fr, ademe.fr, impots.gouv.fr, ecologie.gouv.fr).

Tu reponds UNIQUEMENT avec un JSON valide au format :
{
  "title_tag": "Titre SEO optimise max 60 chars",
  "meta_description": "Resume factuel avec chiffre cle, 150-160 chars",
  "body_html": "<p>Intro...</p><h2>...</h2>... 3500+ mots HTML pur",
  "tldr": ["phrase factuelle 1 avec chiffre", "phrase factuelle 2", "phrase 3", "phrase 4"],
  "sources": [
    {"title": "Titre precis", "url": "https://source-officielle.fr/exact-path", "publisher": "Nom officiel"}
  ],
  "image_query": "query Unsplash en anglais, 2-4 mots evocateurs"
}
"""


def claude_call(system: str, user: str, max_tokens=14000, retries=3) -> str:
    body = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={
            "content-type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
    )
    for attempt in range(retries):
        try:
            r = urllib.request.urlopen(req, timeout=300)
            d = json.loads(r.read())
            return d["content"][0]["text"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and attempt < retries - 1:
                wait = (attempt + 1) * 20
                log.warning(f"  Claude {e.code}, retry {wait}s")
                time.sleep(wait)
                continue
            raise


def generate_article(plan_entry: dict) -> dict:
    serp = plan_entry.get("serp_brief", {}) or {}
    brief_block = ""
    if serp:
        brief_block = f"""
Brief concurrentiel (Gemini + Google Search grounding) :
- Top 10 competitors : {', '.join(serp.get('top10', [])[:5])}
- Weak angles : {', '.join(serp.get('weak_angles', [])[:3])}
- Winning moves : {', '.join(serp.get('winning_moves', [])[:3])}
- Must include : {', '.join(serp.get('must_include_sections', [])[:5])}
- Citable facts : {' | '.join(serp.get('citable_facts', [])[:4])}
- Intent : {serp.get('intent_type', 'informational')}
- Target word count : {serp.get('target_word_count', 3500)}
"""

    blog_labels = {
        "guides": "guide pratique de l'acheteur immobilier",
        "villes": "analyse marche par ville",
        "quartiers": "meilleurs quartiers d'une ville",
    }
    user = f"""Ecris l'article suivant pour ScoreImmo.

Titre : {plan_entry['title']}
Blog : {plan_entry['blog']} ({blog_labels.get(plan_entry['blog'], 'guide')})
Mots-cles : {plan_entry.get('keywords', '')}
Categorie : {plan_entry.get('category', plan_entry['blog'])}
Auteur : {plan_entry.get('author', 'Lea Moreau')}

{brief_block}

Genere l'article complet au format JSON strict demande dans le system prompt. 3500+ mots dans body_html. TL;DR 4 bullets. 5-7 sources officielles FR. Zero em-dash."""

    log.info(f"  Generating article via Claude ({CLAUDE_MODEL})...")
    text = claude_call(SYSTEM_PROMPT, user)
    text = strip_dashes(text)
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def unsplash_image(query: str) -> dict | None:
    if not UNSPLASH_ACCESS_KEY or not query:
        return None
    url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&orientation=landscape&per_page=1"
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


def load_plan() -> list:
    if not ARTICLES_JSON.exists():
        return []
    return json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))


def save_plan(plan: list):
    ARTICLES_JSON.write_text(
        json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8"
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


def file_exists(blog: str, slug: str) -> bool:
    return (CONTENT_DIR / blog / f"{slug}.json").exists()


def write_article_file(blog: str, slug: str, entry: dict):
    out_dir = CONTENT_DIR / blog
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{slug}.json").write_text(
        json.dumps(entry, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def git_commit_push(slug: str, dry_run=False):
    if dry_run:
        log.info("  [dry-run] skip git")
        return
    try:
        subprocess.run(
            ["git", "add", "src/content/articles/", "blog-auto/articles.json"],
            cwd=str(REPO_DIR), check=True,
        )
        subprocess.run(
            ["git",
             "-c", "user.email=blog-bot@score-immo.fr",
             "-c", "user.name=ScoreImmo Blog Bot",
             "commit", "-m", f"chore(blog): publish {slug}"],
            cwd=str(REPO_DIR), check=True,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=str(REPO_DIR), check=True)
        log.info("  Pushed to origin/main")
    except subprocess.CalledProcessError as e:
        log.error(f"  git failed: {e}")
        raise


def submit_url_to_bing(url: str) -> None:
    """Submit a single URL to Bing via Bing URL Submission API (daily quota shared)."""
    import os, json as _json, urllib.request as _ur, urllib.error as _ue
    key = os.environ.get("BING_URL_SUBMISSION_KEY", "").strip()
    if not key:
        return
    site_root = "https://" + url.split("/")[2]
    body = _json.dumps({"siteUrl": site_root, "url": url}).encode("utf-8")
    req = _ur.Request(
        f"https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey={key}",
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "Mozilla/5.0"},
        method="POST",
    )
    try:
        with _ur.urlopen(req, timeout=15) as r:
            print(f"[bing] {url} -> {r.status}")
    except _ue.HTTPError as e:
        print(f"[bing] {url} -> {e.code} {e.read().decode()[:100]}")
    except Exception as e:
        print(f"[bing] {url} -> {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not ANTHROPIC_API_KEY:
        log.error("ANTHROPIC_API_KEY manquant")
        sys.exit(1)

    plan = load_plan()
    if not plan:
        log.info("articles.json vide ou absent. Rien a publier.")
        return

    entry = find_next(plan, force=args.force)
    if not entry:
        log.info("Aucun article a publier (pas d'echeance, ou tous publies).")
        return

    log.info(f"Article : {entry.get('title')}")
    log.info(f"  Blog : {entry.get('blog')} / Category : {entry.get('category','')}")

    generated = generate_article(entry)

    slug = entry.get("slug") or slugify(entry["title"])
    entry["slug"] = slug

    if file_exists(entry["blog"], slug):
        log.warning(f"  DOUBLON: {slug} existe deja, mark published + skip")
        entry["published"] = True
        entry["published_at"] = now_iso()
        save_plan(plan)
        return

    image = unsplash_image(generated.get("image_query", ""))

    author_handle = entry.get("author_handle", "lea-moreau")
    author_name = entry.get("author", "Lea Moreau")
    published_at = now_iso()

    article_json = {
        "id": str(int(time.time())),
        "title": entry["title"],
        "handle": slug,
        "blog": entry["blog"],
        "body_html": generated["body_html"],
        "summary_html": None,
        "author": author_name,
        "author_handle": author_handle,
        "published_at": published_at,
        "updated_at": published_at,
        "last_reviewed": datetime.date.today().isoformat(),
        "tags": entry.get("keywords"),
        "image": image,
        "meta_title": generated.get("title_tag"),
        "meta_description": generated.get("meta_description"),
        "tldr": generated.get("tldr", []),
        "sources": generated.get("sources", []),
        "word_count": len(re.sub(r"<[^>]+>", " ", generated["body_html"]).split()),
    }

    word_count = article_json["word_count"]
    log.info(f"  Generated: {word_count} words, {len(article_json['tldr'])} tldr, {len(article_json['sources'])} sources")

    if word_count < 2500:
        log.warning(f"  WORD COUNT LOW ({word_count} < 2500). Publie quand meme mais flag for review.")

    if args.dry_run:
        log.info("  [dry-run] content not written")
        return

    write_article_file(entry["blog"], slug, article_json)
    log.info(f"  Wrote src/content/articles/{entry['blog']}/{slug}.json")

    entry["published"] = True
    entry["published_at"] = published_at
    save_plan(plan)

    git_commit_push(slug, dry_run=args.dry_run)

    log.info(f"  URL future : https://score-immo.fr/blogs/{entry['blog']}/{slug}")
    submit_url_to_bing(f"https://score-immo.fr/blogs/{entry['blog']}/{slug}")


if __name__ == "__main__":
    main()
