"""
Validate that every internal link in a STACK-2026 project resolves to a real
content file or page. Exit code 1 if any broken link found.

Usage:
  python3 validate_internal_links.py <project-root>
  python3 validate_internal_links.py ~/stack-2026/adapte-toi

The script auto-detects:
  - content_root : {site,.}/src/content
  - pages_root   : {site,.}/src/pages
"""
import re
import sys
from pathlib import Path

LINK_RE = re.compile(r"\]\((/[^)\s]+)\)")


def find_roots(project_root):
    """Find content and pages roots for projects with or without `site/` nested layout."""
    for base in (project_root / "site", project_root):
        cr = base / "src/content"
        pr = base / "src/pages"
        if cr.is_dir() and pr.is_dir():
            return cr, pr
    raise SystemExit(f"Could not locate src/content and src/pages under {project_root}")


def _has_dynamic_file(dir_path):
    """Return True if dir contains any [xxx].astro or [...xxx].astro file."""
    if not dir_path.is_dir():
        return False
    for entry in dir_path.iterdir():
        if entry.is_file() and entry.suffix == ".astro":
            name = entry.stem
            if name.startswith("[") and name.endswith("]"):
                return True
    return False


def _has_catchall(dir_path):
    """[...xxx].astro catches any depth from this dir down."""
    if not dir_path.is_dir():
        return False
    for entry in dir_path.iterdir():
        if entry.is_file() and entry.suffix == ".astro":
            name = entry.stem
            if name.startswith("[...") and name.endswith("]"):
                return True
    return False


def resolve(url, content_root, pages_root):
    url = url.split("#")[0].split("?")[0].rstrip("/")
    if not url:
        return True
    segments = url.strip("/").split("/")

    # 1. Static file matches
    # Full path as single .astro file
    if (pages_root / (url.strip("/") + ".astro")).is_file():
        return True
    # Full path with index.astro
    if (pages_root / url.strip("/") / "index.astro").is_file():
        return True

    # 2. Content collections: /{coll}/{slug} -> content/{coll}/{slug}.md
    if len(segments) >= 2:
        # Direct mapping
        head = segments[0]
        tail = "/".join(segments[1:])
        if (content_root / head / f"{tail}.md").is_file():
            return True
        # Collection alias (ex: dental /smile-insights/ <-> content/blog/)
        if head == "smile-insights" and (content_root / "blog" / f"{tail}.md").is_file():
            return True
    # Single-segment collection index dir
    if len(segments) == 1 and (content_root / segments[0]).is_dir():
        return True

    # 3. Dynamic routes: walk up from full path to root, checking each ancestor
    # for a [slug].astro (matches 1 segment) or [...slug].astro (catches all).
    for i in range(len(segments), 0, -1):
        parent = pages_root / Path(*segments[:i - 1]) if i > 1 else pages_root
        if _has_dynamic_file(parent):
            # If dynamic file is [slug].astro at this level, it catches exactly 1 remaining segment
            # If [...slug].astro, it catches all remaining segments
            remaining = len(segments) - (i - 1)
            if remaining >= 1:
                return True
        if _has_catchall(parent):
            return True

    # 4. Fallback: top-level dynamic catch-all
    if (pages_root / "[slug].astro").is_file() and len(segments) == 1:
        return True
    if (pages_root / "[...slug].astro").is_file():
        return True

    # 5. Non-astro directories with indexes (ex: pages/blog/)
    if len(segments) == 1 and (pages_root / segments[0]).is_dir():
        return True

    return False


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: validate_internal_links.py <project-root>")
    root = Path(sys.argv[1]).expanduser().resolve()
    if not root.is_dir():
        sys.exit(f"Not a directory: {root}")
    content_root, pages_root = find_roots(root)
    md_files = list(content_root.rglob("*.md"))
    total = 0
    broken = []
    for f in md_files:
        for m in LINK_RE.finditer(f.read_text(encoding="utf-8", errors="replace")):
            total += 1
            if not resolve(m.group(1), content_root, pages_root):
                broken.append((f.relative_to(root), m.group(1)))
    print(f"{root.name}: {total} internal links, {len(broken)} broken")
    for path, url in broken[:40]:
        print(f"  BROKEN {url}  ({path})")
    sys.exit(1 if broken else 0)


if __name__ == "__main__":
    main()
